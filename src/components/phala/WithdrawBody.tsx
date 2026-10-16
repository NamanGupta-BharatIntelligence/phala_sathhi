import { fill, inr } from "@/lib/phala/utils";
import Icon from "./Icon";

export type WithdrawState = {
  upi: string;
  err: string;
  submitting: boolean;
  /** Set when POST /withdraw succeeded: the request is pending, not paid. */
  done: { amount: number; upi: string } | null;
};

type Props = {
  t: (k: string) => string;
  amount: number;
  wd: WithdrawState;
  onUpi: (v: string) => void;
};

export default function WithdrawBody({ t, amount, wd, onUpi }: Props) {
  if (wd.done) {
    return (
      <div className="done pending" role="status">
        <svg className="big" viewBox="0 0 84 84" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="42" cy="42" r="37" />
          {/* clock: the request is pending approval, not paid */}
          <path d="M42 24v19l12 8" />
        </svg>
        <h3>{t("wRequested")}</h3>
        <p>{fill(t("wRequestedSub"), { n: wd.done.amount, u: wd.done.upi })}</p>
      </div>
    );
  }
  return (
    <>
      <div className="amtbox"><small>{t("wAmt")}</small>{inr(amount)}</div>
      <div className={`fld${wd.err ? " bad" : ""}`} data-f="upi">
        <label className="lbl" htmlFor="f_upi">{t("upiLabel")}</label>
        <input
          id="f_upi"
          data-k="upi"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="name@upi"
          value={wd.upi}
          readOnly={wd.submitting}
          onChange={(e) => onUpi(e.target.value)}
        />
        <div className="err" role="alert">{wd.err}</div>
      </div>
      <p className="note"><Icon name="clock" />{t("wNote")}</p>
    </>
  );
}
