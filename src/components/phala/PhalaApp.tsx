"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FEE, MIN } from "@/lib/phala/data";
import type {
  AppState, BeforeInstallPromptEvent, Field, FieldStatus, HistoryEntry, Lang, SheetState, TabId,
} from "@/lib/phala/types";
import { buzz, fill, findTask, initialState, inr, pick, translate } from "@/lib/phala/utils";
import Fx, { type FxItem } from "./Fx";
import FormBody from "./FormBody";
import Icon from "./Icon";
import PayTab from "./PayTab";
import ProfileTab from "./ProfileTab";
import Sheet from "./Sheet";
import TasksTab from "./TasksTab";
import WithdrawBody, { type WithdrawState } from "./WithdrawBody";
import { useHour, useInstallEnv, useOnline } from "./hooks";
import { useDemo } from "./useDemo";

type NewFx = FxItem extends infer T ? (T extends FxItem ? Omit<T, "id"> : never) : never;

const emptyWithdraw = (upi: string): WithdrawState => ({ upi, err: "", verified: "", verifying: false, done: null });

export default function PhalaApp() {
  const [s, setS] = useState<AppState>(initialState);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [caption, setCaption] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [fx, setFx] = useState<FxItem[]>([]);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installHidden, setInstallHidden] = useState(false);

  // form sheet
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, FieldStatus>>({});
  const [shaking, setShaking] = useState<Record<string, boolean>>({});
  const [discardAsk, setDiscardAsk] = useState(false);
  // withdraw sheet
  const [wd, setWd] = useState<WithdrawState>(emptyWithdraw(""));

  const env = useInstallEnv();
  const online = useOnline();
  const hour = useHour();

  const lang = s.lang;
  const t = useCallback((k: string) => translate(lang, k), [lang]);

  const cursorRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const pushed = useRef(false);
  const ignorePop = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fxId = useRef(0);
  const formTask = sheet?.kind === "form" ? findTask(sheet.taskId) : null;

  const filledCount = formTask ? formTask.fields.filter((f) => (values[f.k] ?? "").trim() !== "").length : 0;
  const dirty = open && formTask !== null && filledCount > 0;

  // Latest values for window-level listeners and timers.
  const latest = useRef({ s, sheet, open, running, dirty, wd });
  useEffect(() => { latest.current = { s, sheet, open, running, dirty, wd }; });

  /* ---------- chrome ---------- */
  const scrollMainTop = () => {
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const go = (tab: TabId) => {
    setS((p) => ({ ...p, tab, unseen: tab === "pay" ? false : p.unseen }));
    scrollMainTop();
  };

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 2400);
  }, []);

  const pushFx = useCallback((items: NewFx[], ms: number) => {
    const withIds = items.map((i) => ({ ...i, id: ++fxId.current })) as FxItem[];
    setFx((p) => [...p, ...withIds]);
    const ids = new Set(withIds.map((i) => i.id));
    setTimeout(() => setFx((p) => p.filter((i) => !ids.has(i.id))), ms);
  }, []);

  const celebrate = useCallback((text: string) => {
    const cols = ["#F28A1E", "#E3A72F", "#F6D77B", "#E25B1B", "#FFB703"];
    const petals = Array.from({ length: 20 }, (_, i) => {
      const a = Math.random() * Math.PI * 2;
      const d = 70 + Math.random() * 110;
      return {
        kind: "petal" as const,
        color: cols[i % cols.length],
        dx: Math.cos(a) * d,
        dy: Math.sin(a) * d - 30,
        rot: Math.random() * 360 - 180,
      };
    });
    pushFx(petals, 1200);
    pushFx([{ kind: "coin", text }], 1400);
  }, [pushFx]);

  /* ---------- sheet open / close ---------- */
  const openSheet = () => {
    opener.current = document.activeElement;
    setDiscardAsk(false);
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
    if (o && !latest.current.running) {
      try { o.focus({ preventScroll: true }); } catch { /* ignore */ }
    }
    opener.current = null;
  }, []);

  const attemptClose = useCallback(() => {
    const L = latest.current;
    if (L.dirty && !L.running) setDiscardAsk(true);
    else closeNow();
  }, [closeNow]);

  const openForm = (taskId: string) => {
    setSheet({ kind: "form", taskId });
    setValues({});
    setStatus({});
    setShaking({});
    openSheet();
  };

  const openWithdraw = () => {
    const can = s.earned - s.withdrawn;
    if (can < MIN) return;
    setSheet({ kind: "withdraw", amount: can });
    setWd(emptyWithdraw(s.upi));
    openSheet();
  };

  /* ---------- form logic ---------- */
  const fieldError = (f: Field, raw: string) => {
    const v = raw.trim();
    if (!v) return t("req");
    if (f.type === "tel" && !/^[6-9]\d{9}$/.test(v)) return t("badPhone");
    if (f.type === "number" && !(Number(v) > 0)) return t("badNum");
    return "";
  };

  const setErr = useCallback((key: string, msg: string, value: string) => {
    setStatus((p) => ({ ...p, [key]: { err: msg, ok: !msg && value.trim() !== "" } }));
    if (msg) {
      setShaking((p) => ({ ...p, [key]: true }));
      setTimeout(() => setShaking((p) => ({ ...p, [key]: false })), 320);
    }
  }, []);

  const checkField = (key: string, value: string, force: boolean) => {
    const f = formTask?.fields.find((x) => x.k === key);
    if (!f) return;
    if (!value.trim() && !force) return setErr(key, "", value);
    setErr(key, fieldError(f, value), value);
  };

  // Stable wrapper for the demo hook (it only needs the latest task + translations).
  const checkFieldRef = useRef(checkField);
  useEffect(() => { checkFieldRef.current = checkField; });
  const demoCheck = useCallback((k: string, v: string) => checkFieldRef.current(k, v, true), []);

  const onValue = (f: Field, value: string, commit: boolean) => {
    setValues((p) => ({ ...p, [f.k]: value }));
    if (commit) {
      // select/rating/yes-no/photo: validate right away (clears any error for tap-style fields)
      if (f.type === "select") checkField(f.k, value, true);
      else setErr(f.k, "", value);
    } else if (status[f.k]?.err) {
      checkField(f.k, value, true);
    }
  };

  const onBlur = (f: Field, value: string) => {
    if (!running) checkField(f.k, value, false);
  };

  const submitForm = () => {
    if (!formTask) return;
    let first: string | null = null;
    for (const f of formTask.fields) {
      const e = fieldError(f, values[f.k] ?? "");
      setErr(f.k, e, values[f.k] ?? "");
      if (e && !first) first = f.k;
    }
    if (first) {
      document.querySelector(`#shBody [data-f="${first}"]`)?.scrollIntoView({ block: "center" });
      buzz([30, 40, 30]);
      return;
    }
    const entry: HistoryEntry = { type: "work", id: Date.now(), task: formTask.id, ts: Date.now(), amt: FEE };
    setS((p) => ({
      ...p,
      earned: p.earned + FEE,
      done: { ...p.done, [formTask.id]: (p.done[formTask.id] ?? 0) + 1 },
      unseen: p.tab !== "pay" ? true : p.unseen,
      history: [entry, ...p.history],
    }));
    closeNow();
    celebrate("+" + inr(FEE));
    toast(t("earned"));
    buzz(25);
  };

  /* ---------- withdraw logic ---------- */
  const onUpi = (v: string) => setWd((p) => ({ ...p, upi: v, verified: "", err: "" }));

  const confirmWithdraw = () => {
    if (sheet?.kind !== "withdraw") return;
    const u = wd.upi.trim();
    if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(u)) {
      setWd((p) => ({ ...p, err: u ? t("badUpi") : t("req") }));
      buzz([30, 40, 30]);
      return;
    }
    setWd((p) => ({ ...p, err: "" }));
    if (wd.verified !== u) {
      setWd((p) => ({ ...p, verifying: true }));
      setTimeout(() => {
        const L = latest.current;
        if (!L.open || L.sheet?.kind !== "withdraw") return;
        setWd((p) => ({ ...p, verifying: false, verified: u }));
        buzz(15);
      }, 1200);
      return;
    }
    const can = sheet.amount;
    const entry: HistoryEntry = { id: Date.now(), type: "wd", ts: Date.now(), amt: can, upi: u, status: "pending" };
    setS((p) => ({ ...p, withdrawn: p.withdrawn + can, upi: u, history: [entry, ...p.history] }));
    setWd((p) => ({ ...p, done: { amount: can, upi: u } }));
    buzz([20, 40, 20]);
    setTimeout(() => {
      const L = latest.current;
      if (L.open && L.sheet?.kind === "withdraw") closeNow();
    }, 1900);
    setTimeout(() => {
      setS((p) => ({
        ...p,
        history: p.history.map((h) => (h.type === "wd" && h.id === entry.id ? { ...h, status: "paid" } : h)),
      }));
    }, 6500);
  };

  /* ---------- reset / language / demo ---------- */
  const resetApp = useCallback(() => {
    setRunning(false);
    setCaption(null);
    closeNow();
    setToastOn(false);
    setS(initialState());
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [closeNow]);

  const demo = useDemo({ cursorRef, reset: resetApp, setRunning, setCaption, checkField: demoCheck });

  const stopAll = () => { demo.cancel(); resetApp(); };

  const setLang = (l: Lang) => {
    if (s.lang === l) return;
    if (open && !running) closeNow();
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
      if (L.dirty && !L.running) {
        history.pushState({ sheet: 1 }, "");
        pushed.current = true;
        setDiscardAsk(true);
      } else closeNow();
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
  }, [closeNow]);

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
  const wVerified = !wd.verifying && wd.verified !== "" && wd.verified === wd.upi.trim();

  let title: React.ReactNode = null;
  let sub: string | undefined;
  let body: React.ReactNode = null;
  let foot: React.ReactNode = null;
  if (sheet?.kind === "form" && formTask) {
    title = <h3><Icon name={formTask.ic} />{pick(lang, formTask.title)}</h3>;
    sub = t("earnThis");
    body = (
      <FormBody task={formTask} lang={lang} t={t} values={values} status={status} shaking={shaking}
        onValue={onValue} onBlur={onBlur} />
    );
    foot = discardAsk ? (
      <div className="discard" role="alertdialog" aria-label={t("discardQ")}>
        <span>{t("discardQ")}</span>
        <button onClick={() => setDiscardAsk(false)}>{t("keep")}</button>
        <button className="danger" onClick={closeNow}>{t("discard")}</button>
      </div>
    ) : (
      <button className="btn gold block" id="submitForm" onClick={submitForm}>{t("submit")}</button>
    );
  } else if (sheet?.kind === "withdraw") {
    title = wd.done ? <span className="sr">{t("wTitle")}</span> : <h3><Icon name="bank" />{t("wTitle")}</h3>;
    body = <WithdrawBody t={t} amount={sheet.amount} wd={wd} onUpi={onUpi} />;
    foot = wd.done ? null : (
      <button className="btn gold block" id="confirmW" disabled={wd.verifying} onClick={confirmWithdraw}>
        {wVerified ? t("confirmW") : t("verifyUpi")}
      </button>
    );
  }

  const showInstall = !running && !installHidden && !env.standalone && (installEvt !== null || env.ios);

  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <symbol id="feather" viewBox="0 0 40 40">
          <path d="M20 39C20 31 20 25 20 14" stroke="#F6D77B" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <ellipse cx="20" cy="15" rx="11" ry="14" fill="#1E3F9A" stroke="#F6D77B" strokeWidth="1" />
          <ellipse cx="20" cy="15" rx="8" ry="11" fill="#118A8F" />
          <ellipse cx="20" cy="15" rx="5.2" ry="7.5" fill="#0A3F73" />
          <ellipse cx="20" cy="14" rx="2.8" ry="3.8" fill="#E3A72F" />
        </symbol>
      </svg>

      <div id="shell">
        <header>
          <div className="logo">
            <div><b>Phala Sathhi</b><small>फला साथी</small></div>
          </div>
          <button className="hbtn" onClick={() => setLang(lang === "en" ? "hi" : "en")} aria-label="Switch language">
            {lang === "en" ? "हिं" : "EN"}
          </button>
          <button className={`hbtn demo${running ? " on" : ""}`} onClick={() => (running ? stopAll() : demo.run())}>
            <span aria-hidden="true">{running ? "■" : "▶"}</span><span>{running ? t("stop") : t("demo")}</span>
          </button>
          <button className="hbtn" onClick={stopAll} aria-label="Reset">
            <span aria-hidden="true">↺</span><span className="rl">{t("reset")}</span>
          </button>
        </header>
        <div id="net" className={online ? "" : "show"} role="status">{t("offline")}</div>

        <main id="main">
          <TasksTab
            active={s.tab === "tasks"} lang={lang} t={t} earned={s.earned} done={s.done} hour={hour}
            showInstall={showInstall} canInstall={installEvt !== null}
            onInstall={() => {
              if (!installEvt) return;
              installEvt.prompt();
              installEvt.userChoice.finally(() => setInstallEvt(null));
            }}
            onHideInstall={() => setInstallHidden(true)}
            onAccept={openForm}
          />
          <PayTab
            active={s.tab === "pay"} lang={lang} t={t} earned={s.earned} withdrawn={s.withdrawn}
            history={s.history} onWithdraw={openWithdraw}
          />
          <ProfileTab
            active={s.tab === "profile"} lang={lang} t={t} state={s} onLang={setLang}
            onLogout={() => toast(t("logoutDemo"))}
          />
        </main>

        <nav id="nav" aria-label="Main">
          <button data-nav="tasks" className={s.tab === "tasks" ? "on" : ""} aria-current={s.tab === "tasks" ? "page" : undefined} onClick={() => go("tasks")}>
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

        <div id="caption" className={caption ? "show" : ""} aria-live="polite">{caption ? t(caption) : ""}</div>
        <div id="toast" className={toastOn ? "show" : ""} role="status" aria-live="polite">{toastMsg}</div>

        <Sheet
          open={open}
          sheetRef={sheetRef}
          bodyRef={bodyRef}
          title={title}
          sub={sub}
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
          onBackdrop={() => { if (!running) attemptClose(); }}
        />
        <Fx items={fx} />
      </div>
      <div id="cursor" ref={cursorRef} />
    </>
  );
}
