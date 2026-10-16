import { fill, inr } from "@/lib/phala/utils";
import Icon from "./Icon";

export type WithdrawState = {
  upi: string;
  err: string;
  verified: string;
  verifying: boolean;
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
      <div className="ok" role="status">
        <svg className="big" viewBox="0 0 84 84" fill="none" stroke="#17753F" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="42" cy="42" r="37" />
          <path d="M26 43l11 11 21-23" />
        </svg>
        <h3>{t("wOk")}</h3>
        <p>{fill(t("wOkSub"), { n: wd.done.amount, u: wd.done.upi })}</p>
      </div>
    );
  }
  const verified = !wd.verifying && wd.verified !== "" && wd.verified === wd.upi.trim();
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
          readOnly={wd.verifying}
          onChange={(e) => onUpi(e.target.value)}
        />
        <div className="err" role="alert">{wd.err}</div>
      </div>
      <div className={`vfy${wd.verifying ? " wait" : verified ? " ok" : ""}`} id="vfy" aria-live="polite">
        {wd.verifying && <><span className="spin" />{t("verifying")}</>}
        {verified && <><Icon name="check" />{fill(t("verifiedAs"), { n: t("pName") })}</>}
      </div>
      <p className="note"><Icon name="shield" />{t("demoNote")}</p>
    </>
  );
}
