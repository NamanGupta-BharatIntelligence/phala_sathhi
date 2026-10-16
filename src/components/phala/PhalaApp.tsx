"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mapApiTasks } from "@/lib/phala/catalog";
import {
  ApiError, services, setUnauthenticatedHandler,
  type ApiPayment, type ApiProfile, type ApiSubmission, type ApiWithdrawal,
} from "@/lib/phala/services";
import type {
  ActiveTask, AppState, BeforeInstallPromptEvent, Field, HistoryEntry, Lang, SheetState, TabId,
} from "@/lib/phala/types";
import { buzz, fill, initialState, pick, translate } from "@/lib/phala/utils";
import Icon from "./Icon";
import LoginScreen from "./LoginScreen";
import PayTab, { isPendingStatus, type Loadable } from "./PayTab";
import ProfileTab from "./ProfileTab";
import Sheet from "./Sheet";
import TaskDetail from "./TaskDetail";
import TasksTab, { type TaskListState } from "./TasksTab";
import TaskForm from "./forms/TaskForm";
import { useTaskForm } from "./forms/useTaskForm";
import WithdrawBody, { type WithdrawState } from "./WithdrawBody";
import { useHour, useInstallEnv, useOnline } from "./hooks";

/** Same rule the server applies to upi_id (api_integration.md §2.8). */
const UPI_RE = /^[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}$/;

const emptyWithdraw = (upi: string): WithdrawState => ({ upi, err: "", submitting: false, done: null });
const toTs = (iso: string) => { const n = Date.parse(iso); return Number.isFinite(n) ? n : 0; };
const codeOf = (e: unknown) => (e instanceof ApiError ? e.code : "INTERNAL");

/* Accepted tasks + their drafts live on this device only (the backend has no accept/draft API). */
const draftsKey = (uid: string) => `phala_drafts_${uid}`;
function readDrafts(uid: string): Record<string, ActiveTask> {
  try {
    const v = JSON.parse(localStorage.getItem(draftsKey(uid)) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
function writeDrafts(uid: string, active: Record<string, ActiveTask>) {
  try { localStorage.setItem(draftsKey(uid), JSON.stringify(active)); } catch { /* storage unavailable */ }
}
function clearDrafts(uid: string) {
  try { localStorage.removeItem(draftsKey(uid)); } catch { /* storage unavailable */ }
}

type Boot = "checking" | "in" | "out";

export default function PhalaApp() {
  const [s, setS] = useState<AppState>(initialState);
  const [boot, setBoot] = useState<Boot>("checking");
  const [loginNotice, setLoginNotice] = useState("");

  // account data: the API is the source of truth
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [list, setList] = useState<TaskListState>({ status: "loading" });
  const [forms, setForms] = useState<Loadable<ApiSubmission[]>>({ status: "loading" });
  const [payment, setPayment] = useState<Loadable<ApiPayment>>({ status: "loading" });
  const [wds, setWds] = useState<Loadable<ApiWithdrawal[]>>({ status: "loading" });

  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [open, setOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installHidden, setInstallHidden] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const [wd, setWd] = useState<WithdrawState>(emptyWithdraw(""));

  const env = useInstallEnv();
  const online = useOnline();
  const hour = useHour();

  const lang = s.lang;
  const t = useCallback((k: string) => translate(lang, k), [lang]);

  const sheetRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const pushed = useRef(false);
  const ignorePop = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const tasks = useMemo(() => (list.status === "ready" ? list.tasks : []), [list]);
  const taskById = (id: string) => tasks.find((x) => x.id === id) ?? null;
  const formTask = sheet?.kind === "form" ? taskById(sheet.taskId) : null;

  // form sheet: values, validation, drafts and submit phase
  const form = useTaskForm(formTask, t);
  const { values, filledCount } = form;

  // Latest values for window-level listeners, timers and async callbacks.
  const latest = useRef({ s, sheet, open, values, phase: form.phase, profile });
  useEffect(() => { latest.current = { s, sheet, open, values, phase: form.phase, profile }; });

  /* ---------- derived from API data ---------- */
  /** Submissions per visible task (GET /forms). */
  const done = useMemo(() => {
    const m: Record<string, number> = {};
    if (forms.status !== "ready") return m;
    for (const f of forms.data) {
      const tk = tasks.find((x) => x.apiName === f.task);
      if (tk) m[tk.id] = (m[tk.id] ?? 0) + 1;
    }
    return m;
  }, [forms, tasks]);

  /** GET /forms + GET /withdrawals merged by time, newest first. */
  const historyRows = useMemo((): Loadable<HistoryEntry[]> => {
    if (forms.status === "error" || wds.status === "error") return { status: "error" };
    if (forms.status === "loading" || wds.status === "loading") return { status: "loading" };
    const rows: HistoryEntry[] = [
      ...forms.data.map((f): HistoryEntry => ({ type: "work", id: f.submission_id, task: f.task, ts: toTs(f.submitted_at) })),
      ...wds.data.map((w): HistoryEntry => ({
        type: "wd",
        id: w.withdrawal_id,
        ts: toTs(w.requested_at),
        amt: Number(w.amount) || 0,
        upi: w.upi_id,
        // Only an explicit "paid" from the sheet is shown as paid; anything else is pending.
        status: String(w.status ?? "").trim().toLowerCase() === "paid" ? "paid" : "pending",
      })),
    ];
    return { status: "ready", data: rows.sort((a, b) => b.ts - a.ts) };
  }, [forms, wds]);

  /** UPI ID of the latest withdrawal request. */
  const lastUpi = useMemo(() => {
    if (wds.status !== "ready" || !wds.data.length) return "";
    return [...wds.data].sort((a, b) => toTs(b.requested_at) - toTs(a.requested_at))[0].upi_id || "";
  }, [wds]);

  /** Number of filled fields in an accepted task's saved draft. */
  const filledFor = (id: string) => {
    const a = s.active[id];
    const tk = taskById(id);
    if (!a || !tk) return 0;
    return tk.fields.filter((f) => (a.draft[f.k] ?? "").trim() !== "").length;
  };

  /* ---------- loaders (failed refreshes keep the last good data) ---------- */
  const loadTasks = useCallback(async () => {
    setList({ status: "loading" });
    try {
      setList({ status: "ready", tasks: mapApiTasks(await services.tasks.list()) });
    } catch {
      setList({ status: "error" });
    }
  }, []);

  const loadForms = useCallback(async () => {
    try {
      const data = await services.tasks.submissions();
      setForms({ status: "ready", data: Array.isArray(data) ? data : [] });
    } catch {
      setForms((p) => (p.status === "ready" ? p : { status: "error" }));
    }
  }, []);

  const loadWallet = useCallback(async () => {
    await Promise.all([
      services.wallet.payment()
        .then((data) => setPayment({ status: "ready", data }))
        .catch(() => setPayment((p) => (p.status === "ready" ? p : { status: "error" }))),
      services.wallet.withdrawals()
        .then((data) => setWds({ status: "ready", data: Array.isArray(data) ? data : [] }))
        .catch(() => setWds((p) => (p.status === "ready" ? p : { status: "error" }))),
    ]);
  }, []);

  const applyProfile = useCallback((p: ApiProfile) => {
    setProfile(p);
    // restore this Saathi's accepted tasks/drafts saved on this device
    setS((prev) => ({ ...prev, active: { ...readDrafts(p.u_id), ...prev.active } }));
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      applyProfile(await services.profile.get());
    } catch { /* profile stays empty; UNAUTHENTICATED is handled globally */ }
  }, [applyProfile]);

  const retryPay = () => {
    if (payment.status === "error") setPayment({ status: "loading" });
    if (forms.status === "error") setForms({ status: "loading" });
    if (wds.status === "error") setWds({ status: "loading" });
    loadWallet();
    loadForms();
  };

  /* ---------- chrome ---------- */
  const go = (tab: TabId, detail?: string) => {
    setS((p) => ({
      ...p,
      tab,
      detail: tab === "detail" ? detail ?? p.detail : p.detail,
      unseen: tab === "pay" ? false : p.unseen,
    }));
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 2400);
  }, []);

  /* ---------- sheet open / close ---------- */
  const openSheet = () => {
    opener.current = document.activeElement;
    setOpen(true);
    if (!pushed.current) {
      history.pushState({ sheet: 1 }, "");
      pushed.current = true;
    }
    setTimeout(() => {
      try { sheetRef.current?.focus({ preventScroll: true }); } catch { /* ignore */ }
    }, 50);
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  };

  const closeNow = useCallback(() => {
    setOpen(false);
    if (pushed.current) {
      pushed.current = false;
      ignorePop.current++;
      history.back();
    }
    const o = opener.current as HTMLElement | null;
    if (o) {
      try { o.focus({ preventScroll: true }); } catch { /* ignore */ }
    }
    opener.current = null;
  }, []);

  /** Keep the open form's answers on its accepted task, so it can be continued later. */
  const saveDraft = useCallback(() => {
    const L = latest.current;
    if (L.sheet?.kind !== "form") return 0;
    const id = L.sheet.taskId;
    const draft: Record<string, string> = { ...L.values };
    setS((p) => (p.active[id] ? { ...p, active: { ...p.active, [id]: { ...p.active[id], draft } } } : p));
    return Object.values(draft).filter((v) => String(v).trim() !== "").length;
  }, []);

  const attemptClose = useCallback(() => {
    const L = latest.current;
    if (L.phase === "submitting") return; // wait for the submission result
    if (L.open && L.sheet?.kind === "form") {
      const filled = saveDraft();
      closeNow();
      if (filled > 0) toast(translate(L.s.lang, "saved"));
      return;
    }
    closeNow();
  }, [closeNow, saveDraft, toast]);

  /* ---------- session ---------- */
  /** Clears all account data from memory and shows sign-in. */
  const signOutLocal = useCallback((expired: boolean) => {
    closeNow();
    setProfile(null);
    setList({ status: "loading" });
    setForms({ status: "loading" });
    setPayment({ status: "loading" });
    setWds({ status: "loading" });
    setWd(emptyWithdraw(""));
    setSheet(null);
    setS((p) => ({ ...initialState(), lang: p.lang }));
    setLoginNotice(expired ? translate(latest.current.s.lang, "l_expired") : "");
    setBoot("out");
  }, [closeNow]);

  const logout = () => {
    if (profile) clearDrafts(profile.u_id); // drafts can hold customer details
    services.auth.signOut();
    signOutLocal(false);
  };

  // App start: a stored token means signed in; any UNAUTHENTICATED reply drops back to sign-in.
  useEffect(() => {
    setUnauthenticatedHandler(() => signOutLocal(true));
    const id = setTimeout(() => setBoot(services.auth.hasSession() ? "in" : "out"), 0);
    return () => { clearTimeout(id); setUnauthenticatedHandler(null); };
  }, [signOutLocal]);

  // Signed in: load everything from the API.
  useEffect(() => {
    if (boot !== "in") return;
    const id = setTimeout(() => {
      if (!latest.current.profile) loadProfile();
      loadTasks();
      loadForms();
      loadWallet();
    }, 0);
    return () => clearTimeout(id);
  }, [boot, loadProfile, loadTasks, loadForms, loadWallet]);

  // Persist accepted tasks/drafts per Saathi on this device.
  useEffect(() => {
    if (profile) writeDrafts(profile.u_id, s.active);
  }, [profile, s.active]);

  /* ---------- tasks & forms ---------- */
  /** Accept a task (kept on this device: the backend has no accept endpoint) or continue it. */
  const openForm = (taskId: string) => {
    const tk = taskById(taskId);
    if (!tk || !tk.fields.length) return;
    const existing = s.active[taskId];
    if (!existing) {
      setS((p) => ({ ...p, active: { ...p.active, [taskId]: { ts: Date.now(), draft: {} } } }));
      toast(t("accepted"));
      buzz(15);
    }
    setSubmitMsg("");
    setSheet({ kind: "form", taskId });
    form.load(existing?.draft ?? {});
    openSheet();
  };

  const onBlur = (f: Field, value: string) => form.checkField(f.k, value, false);

  /** POST /form with { task, response: values }. Money is not credited by this call. */
  const submitForm = async () => {
    if (!formTask?.apiName || form.phase === "submitting") return;
    const first = form.validateAll();
    if (first) {
      document.querySelector(`#shBody [data-f="${first}"]`)?.scrollIntoView({ block: "center" });
      buzz([30, 40, 30]);
      return;
    }
    setSubmitMsg("");
    form.setPhase("submitting");
    try {
      await services.tasks.submit(formTask.apiName, { ...values });
    } catch (e) {
      const code = codeOf(e);
      if (code === "UNAUTHENTICATED") return; // signed out by the global handler
      buzz([30, 40, 30]);
      if (code === "TASK_NOT_FOUND") {
        // The task was removed from the sheet: close the form, drop it from My tasks, refresh the list.
        const id = formTask.id;
        form.setPhase("idle");
        closeNow();
        setS((p) => ({
          ...p,
          active: Object.fromEntries(Object.entries(p.active).filter(([k]) => k !== id)),
          tab: p.tab === "detail" ? "tasks" : p.tab,
        }));
        toast(t("taskGone"));
        loadTasks();
        return;
      }
      saveDraft(); // keep the answers so the Saathi can retry
      form.setPhase("error");
      setSubmitMsg(code === "NETWORK" ? t("submitOffline") : t("submitErr"));
      return;
    }
    form.setPhase("idle");
    const id = formTask.id;
    setS((p) => ({
      ...p,
      active: Object.fromEntries(Object.entries(p.active).filter(([k]) => k !== id)),
      tab: p.tab === "detail" ? "tasks" : p.tab,
      unseen: p.tab !== "pay" ? true : p.unseen,
    }));
    closeNow();
    toast(t("formSent"));
    buzz(25);
    loadForms();
  };

  /* ---------- withdrawals ---------- */
  const openWithdraw = () => {
    if (payment.status !== "ready") return;
    const p = payment.data;
    if (p.amount_withdrawable < p.min_withdraw || isPendingStatus(p.status)) return;
    setSheet({ kind: "withdraw", amount: p.amount_withdrawable, min: p.min_withdraw });
    setWd(emptyWithdraw(lastUpi));
    openSheet();
  };

  const onUpi = (v: string) => setWd((p) => ({ ...p, upi: v, err: "" }));

  /** POST /withdraw. The request is pending until admin pays it; balances are re-fetched, never computed. */
  const confirmWithdraw = async () => {
    if (sheet?.kind !== "withdraw" || wd.submitting) return;
    const u = wd.upi.trim();
    if (!UPI_RE.test(u)) {
      setWd((p) => ({ ...p, err: u ? t("badUpi") : t("req") }));
      buzz([30, 40, 30]);
      return;
    }
    const { amount, min } = sheet;
    setWd((p) => ({ ...p, err: "", submitting: true }));
    try {
      const r = await services.wallet.withdraw(amount, u);
      setWd((p) => ({ ...p, submitting: false, done: { amount: Number(r?.amount) || amount, upi: r?.upi_id || u } }));
      buzz([20, 40, 20]);
      loadWallet();
      setTimeout(() => {
        const L = latest.current;
        if (L.open && L.sheet?.kind === "withdraw") closeNow();
      }, 2200);
    } catch (e) {
      const code = codeOf(e);
      if (code === "UNAUTHENTICATED") return;
      const msg =
        code === "BELOW_MIN" ? fill(t("minBtn"), { n: min })
          : code === "INSUFFICIENT" ? t("wInsufficient")
          : code === "PENDING_EXISTS" ? t("wPendingExists")
          : code === "BAD_REQUEST" ? t("badUpi")
          : code === "NETWORK" ? t("offline")
          : t("wdErr");
      setWd((p) => ({ ...p, submitting: false, err: msg }));
      if (code === "INSUFFICIENT" || code === "PENDING_EXISTS" || code === "BELOW_MIN") loadWallet();
      buzz([30, 40, 30]);
    }
  };

  /* ---------- language ---------- */
  const setLang = (l: Lang) => {
    if (s.lang === l) return;
    if (open && form.phase !== "submitting") { saveDraft(); closeNow(); }
    setS((p) => ({ ...p, lang: l }));
  };

  /* ---------- global listeners ---------- */
  useEffect(() => {
    document.documentElement.lang = s.lang;
  }, [s.lang]);

  useEffect(() => {
    const onPop = () => {
      if (ignorePop.current > 0) { ignorePop.current--; return; }
      pushed.current = false;
      const L = latest.current;
      if (!L.open) return;
      if (L.sheet?.kind === "form") saveDraft();
      closeNow();
    };
    const onInstall = (e: Event) => { e.preventDefault(); setInstallEvt(e as BeforeInstallPromptEvent); };
    const onInstalled = () => { setInstallEvt(null); setInstallHidden(true); };
    window.addEventListener("popstate", onPop);
    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [closeNow, saveDraft]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { attemptClose(); return; }
      if (e.key !== "Tab") return;
      const sh = sheetRef.current;
      if (!sh) return;
      const els = [...sh.querySelectorAll<HTMLElement>("button:not([disabled]),input:not([readonly]),select")]
        .filter((x) => x.offsetParent !== null);
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1], a = document.activeElement;
      if (e.shiftKey && (a === first || a === sh)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, attemptClose]);

  /* ---------- sheet content ---------- */
  const total = formTask?.fields.length ?? 0;

  let title: React.ReactNode = null;
  let body: React.ReactNode = null;
  let foot: React.ReactNode = null;
  if (sheet?.kind === "form" && formTask) {
    title = <h3><Icon name={formTask.ic} />{pick(lang, formTask.title)}</h3>;
    body = (
      <TaskForm task={formTask} lang={lang} t={t} values={values} status={form.status} shaking={form.shaking}
        onValue={form.onValue} onBlur={onBlur} />
    );
    foot = (
      <>
        {form.phase === "error" && <p className="ferr" role="alert">{submitMsg || t("submitErr")}</p>}
        <button className="btn gold block" id="submitForm" disabled={form.phase === "submitting"} onClick={submitForm}>
          {form.phase === "submitting"
            ? <><span className="spin" />{t("submitting")}</>
            : form.phase === "error" ? t("retry") : t("submit")}
        </button>
      </>
    );
  } else if (sheet?.kind === "withdraw") {
    title = wd.done
      ? <span className="sr">{t("wTitle")}</span>
      : <h3><Icon name="bank" />{t("wTitle")}</h3>;
    body = <WithdrawBody t={t} amount={sheet.amount} wd={wd} onUpi={onUpi} />;
    foot = wd.done ? null : (
      <button className="btn gold block" id="confirmW" disabled={wd.submitting} onClick={confirmWithdraw}>
        {wd.submitting ? <><span className="spin" />{t("submitting")}</> : t("wRequest")}
      </button>
    );
  }

  const showInstall = !installHidden && !env.standalone && (installEvt !== null || env.ios);

  if (boot === "checking") return <div className="boot" aria-busy="true" />;

  if (boot === "out") {
    return (
      <LoginScreen
        lang={lang} t={t} notice={loginNotice}
        onLang={(l) => setS((p) => ({ ...p, lang: l }))}
        onSignedIn={(p) => {
          applyProfile(p);
          setLoginNotice("");
          setBoot("in");
          window.scrollTo({ top: 0, behavior: "instant" });
        }}
      />
    );
  }

  const pay = payment.status === "ready" ? payment.data : null;

  return (
    <>
      <div id="shell">
        <header>
          <div className="logo">
            <div><b>Phala Sathhi</b><small>फला साथी</small></div>
          </div>
          <button
            className={`pbtn${s.tab === "profile" ? " on" : ""}`}
            data-nav="profile"
            aria-label={t("profile")}
            onClick={() => go("profile")}
          >
            <Icon name="user" />
          </button>
        </header>
        <div id="net" className={online ? "" : "show"} role="status">{t("offline")}</div>

        <main id="main">
          <TasksTab
            active={s.tab === "tasks"} lang={lang} t={t} earned={pay?.amount_balance ?? 0} done={done} hour={hour}
            list={list} onRetry={loadTasks}
            activeTasks={Object.fromEntries(Object.entries(s.active).filter(([id]) => taskById(id)))}
            filledFor={filledFor}
            showInstall={showInstall} canInstall={installEvt !== null}
            onInstall={() => {
              if (!installEvt) return;
              installEvt.prompt();
              installEvt.userChoice.finally(() => setInstallEvt(null));
            }}
            onHideInstall={() => setInstallHidden(true)}
            onAccept={openForm}
            onDetail={(id) => go("detail", id)}
          />
          <TaskDetail
            active={s.tab === "detail"} lang={lang} t={t}
            task={s.detail ? taskById(s.detail) : null}
            progress={s.detail ? s.active[s.detail] : undefined}
            filled={s.detail ? filledFor(s.detail) : 0}
            doneCount={s.detail ? done[s.detail] ?? 0 : 0}
            accepting={false}
            onBack={() => go("tasks")}
            onAccept={openForm}
          />
          <PayTab
            active={s.tab === "pay"} lang={lang} t={t}
            payment={payment} history={historyRows} tasks={tasks}
            onWithdraw={openWithdraw} onRetry={retryPay}
          />
          <ProfileTab
            active={s.tab === "profile"} lang={lang} t={t}
            profile={profile}
            formsCount={forms.status === "ready" ? forms.data.length : null}
            payment={pay}
            upi={lastUpi}
            onLang={setLang}
            onLogout={logout}
          />
        </main>

        <nav id="nav" aria-label="Main">
          <button data-nav="tasks" className={s.tab === "tasks" || s.tab === "detail" ? "on" : ""} aria-current={s.tab === "tasks" || s.tab === "detail" ? "page" : undefined} onClick={() => go("tasks")}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 13l2 2 4-4" /></svg>
            <span>{t("tasks")}</span>
          </button>
          <button data-nav="pay" className={s.tab === "pay" ? "on" : ""} aria-current={s.tab === "pay" ? "page" : undefined} onClick={() => go("pay")}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M3 10h18M16 15h2" /><path d="M6 6l9-3 2 3" /></svg>
            <span>{t("pay")}</span>
            <i className="dot" hidden={!s.unseen || s.tab === "pay"} />
          </button>
          <button data-nav="profile" className={s.tab === "profile" ? "on" : ""} aria-current={s.tab === "profile" ? "page" : undefined} onClick={() => go("profile")}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.5 4-6 8-6s7 1.5 8 6" /></svg>
            <span>{t("profile")}</span>
          </button>
        </nav>

        <div id="toast" className={toastOn ? "show" : ""} role="status" aria-live="polite">{toastMsg}</div>

        <Sheet
          open={open}
          sheetRef={sheetRef}
          bodyRef={bodyRef}
          title={title}
          progress={
            formTask
              ? {
                  pct: Math.round((filledCount / total) * 100),
                  full: filledCount === total,
                  text: fill(t("progress"), { n: filledCount, m: total }),
                }
              : null
          }
          body={body}
          foot={foot}
          closeLabel={t("close")}
          onClose={attemptClose}
          onBackdrop={attemptClose}
        />
      </div>
    </>
  );
}
