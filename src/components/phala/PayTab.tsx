import { MIN } from "@/lib/phala/data";
import { findTask, inr, pick, when } from "@/lib/phala/utils";
import type { HistoryEntry, Lang } from "@/lib/phala/types";
import AnimatedRupees from "./AnimatedRupees";
import Icon from "./Icon";

type Props = {
  active: boolean;
  lang: Lang;
  t: (k: string) => string;
  earned: number;
  withdrawn: number;
  history: HistoryEntry[];
  onWithdraw: () => void;
};

/** "Earn <b>₹5</b> ..." style strings carry one bold span. */
function WithBold({ text }: { text: string }) {
  return (
    <>
      {text.split(/(<b>.*?<\/b>)/).map((part, i) =>
        part.startsWith("<b>") ? <b key={i}>{part.slice(3, -4)}</b> : part,
      )}
    </>
  );
}

export default function PayTab({ active, lang, t, earned, withdrawn, history, onWithdraw }: Props) {
  const can = earned - withdrawn;

  return (
    <section className={`tab${active ? " active" : ""}`} id="tab-pay" aria-label={t("pay")}>
      <div className="hero">
        <span className="sp" aria-hidden="true">✦</span>
        <span className="sp" aria-hidden="true">✦</span>
        <span className="sp" aria-hidden="true">✦</span>
        <div className="lt">{t("lifetime")}</div>
        <div className="big"><AnimatedRupees value={earned} /></div>
        <div className="row"><span>{t("withdrawn")}</span><b>{inr(withdrawn)}</b></div>
        <div className="row"><span>{t("withdrawable")}</span><b>{inr(can)}</b></div>
        <button className="wbtn" disabled={can < MIN} onClick={onWithdraw}>
          {can >= MIN ? t("wBtn") : t("minBtn")}
        </button>
      </div>
      <div className="strip"><Icon name="coin" /><span><WithBold text={t("strip")} /></span></div>
      <div className="sec-title">{t("history")}</div>
      {history.length ? (
        history.map((h) =>
          h.type === "work" ? (
            <div className="hist" key={h.id}>
              <div className="hi" style={{ background: findTask(h.task).bg, color: findTask(h.task).fg }}>
                <Icon name={findTask(h.task).ic} />
              </div>
              <div className="m">
                <h4>{pick(lang, findTask(h.task).title)}</h4>
                <small>{t("formDone")} · {when(h.ts, lang)}</small>
              </div>
              <div className="amt plus">+{inr(h.amt)}</div>
            </div>
          ) : (
            <div className="hist" key={h.id}>
              <div className="hi" style={{ background: "#E0E8FB", color: "#1E3F9A" }}><Icon name="bank" /></div>
              <div className="m">
                <h4>{t("wdrawal")}</h4>
                <small>{h.upi} · {when(h.ts, lang)}</small>
              </div>
              <div>
                <div className="amt minus">−{inr(h.amt)}</div>
                <span className={`pill ${h.status}`}>
                  <Icon name={h.status === "paid" ? "check" : "clock"} />{t(h.status === "paid" ? "paid" : "pending")}
                </span>
              </div>
            </div>
          ),
        )
      ) : (
        <div className="empty">
          <svg viewBox="0 0 40 40" aria-hidden="true"><use href="#feather" /></svg>
          <br />{t("emptyH")}
        </div>
      )}
    </section>
  );
}
