import { taskLabel, taskLook } from "@/lib/phala/catalog";
import type { ApiPayment } from "@/lib/phala/services";
import { fill, inr, when } from "@/lib/phala/utils";
import type { HistoryEntry, Lang, Task } from "@/lib/phala/types";
import AnimatedRupees from "./AnimatedRupees";
import Icon from "./Icon";

export type Loadable<T> =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: T };

type Props = {
  active: boolean;
  lang: Lang;
  t: (k: string) => string;
  /** GET /payment */
  payment: Loadable<ApiPayment>;
  /** GET /forms + GET /withdrawals merged, newest first. */
  history: Loadable<HistoryEntry[]>;
  /** Visible tasks, used to label history rows. */
  tasks: Task[];
  onWithdraw: () => void;
  onRetry: () => void;
};

/** Payment status from the sheet; anything except "pending" allows a new request. */
export const isPendingStatus = (s: string | undefined) => (s ?? "").trim().toLowerCase() === "pending";

export default function PayTab({ active, lang, t, payment, history, tasks, onWithdraw, onRetry }: Props) {
  const p = payment.status === "ready" ? payment.data : null;
  const pending = p ? isPendingStatus(p.status) : false;
  const canWithdraw = !!p && p.amount_withdrawable >= p.min_withdraw && !pending;

  return (
    <section className={`tab${active ? " active" : ""}`} id="tab-pay" aria-label={t("pay")}>
      {payment.status === "loading" && (
        <div className="state hero-state" role="status"><span className="spin" />{t("loading")}</div>
      )}
      {payment.status === "error" && (
        <div className="state bad hero-state" role="alert">
          <span>{t("loadErr")}</span>
          <button className="btn teal" onClick={onRetry}>{t("retry")}</button>
        </div>
      )}
      {p && (
        <div className="hero">
          <span className="sp" aria-hidden="true">✦</span>
          <span className="sp" aria-hidden="true">✦</span>
          <span className="sp" aria-hidden="true">✦</span>
          <div className="lt">{t("balance")}</div>
          <div className="big"><AnimatedRupees value={p.amount_balance} /></div>
          <div className="row"><span>{t("withdrawn")}</span><b>{inr(p.amount_withdrawn)}</b></div>
          <div className="row"><span>{t("withdrawable")}</span><b>{inr(p.amount_withdrawable)}</b></div>
          <button className="wbtn" disabled={!canWithdraw} onClick={onWithdraw}>
            {pending ? t("wPendingBtn") : canWithdraw ? t("wBtn") : fill(t("minBtn"), { n: p.min_withdraw })}
          </button>
        </div>
      )}
      {/* "Earn ₹5 for every form" strip removed: forms are not credited automatically (api_integration.md §2.5). */}

      <div className="sec-title">{t("history")}</div>
      {history.status === "loading" && (
        <div className="state" role="status"><span className="spin" />{t("loading")}</div>
      )}
      {history.status === "error" && (
        <div className="state bad" role="alert">
          <span>{t("loadErr")}</span>
          <button className="btn teal" onClick={onRetry}>{t("retry")}</button>
        </div>
      )}
      {history.status === "ready" && (history.data.length ? (
        history.data.map((h) => {
          if (h.type === "work") {
            const look = taskLook(h.task, tasks);
            return (
              <div className="hist" key={`f-${h.id}`}>
                <div className="hi" style={{ background: look.bg, color: look.fg }}><Icon name={look.ic} /></div>
                <div className="m">
                  <h4>{taskLabel(h.task, lang, tasks)}</h4>
                  <small>{t("formDone")}{h.ts ? ` · ${when(h.ts, lang)}` : ""}</small>
                </div>
              </div>
            );
          }
          return (
            <div className="hist" key={`w-${h.id}`}>
              <div className="hi" style={{ background: "#E0E8FB", color: "#1E3F9A" }}><Icon name="bank" /></div>
              <div className="m">
                <h4>{t("wdrawal")}</h4>
                <small>{h.upi}{h.ts ? ` · ${when(h.ts, lang)}` : ""}</small>
              </div>
              <div>
                <div className="amt minus">−{inr(h.amt)}</div>
                <span className={`pill ${h.status}`}>
                  <Icon name={h.status === "paid" ? "check" : "clock"} />{t(h.status === "paid" ? "paid" : "pending")}
                </span>
              </div>
            </div>
          );
        })
      ) : (
        <div className="empty">
          {t("emptyH")}
        </div>
      ))}
    </section>
  );
}
