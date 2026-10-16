import { inr } from "@/lib/phala/utils";
import type { ApiPayment, ApiProfile } from "@/lib/phala/services";
import type { Lang } from "@/lib/phala/types";
// import type { IconName } from "@/lib/phala/types"; // used by the hidden Badges section below
import Icon from "./Icon";

type Props = {
  active: boolean;
  lang: Lang;
  t: (k: string) => string;
  /** GET /profile (null while loading). */
  profile: ApiProfile | null;
  /** Number of submissions from GET /forms (null while loading). */
  formsCount: number | null;
  /** GET /payment (null while loading). */
  payment: ApiPayment | null;
  /** UPI ID of the latest withdrawal request, if any. */
  upi: string;
  onLang: (l: Lang) => void;
  onLogout: () => void;
};

/** "9876543210" → "+91 98765 43210" */
const fmtMobile = (m: string) => {
  const d = m.replace(/\D/g, "");
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : m;
};

export default function ProfileTab({ active, lang, t, profile, formsCount, payment, upi, onLang, onLogout }: Props) {
  /* Badges are hidden for now. Restore together with the Badges section below
     (derive from formsCount / payment, per api_integration.md §7).
  const badges: { k: string; ic: IconName; on: boolean }[] = [
    { k: "b1", ic: "award", on: (formsCount ?? 0) >= 1 },
    { k: "b2", ic: "coin", on: (payment?.amount_balance ?? 0) + (payment?.amount_withdrawn ?? 0) >= 10 },
    { k: "b3", ic: "bank", on: (payment?.amount_withdrawn ?? 0) > 0 },
  ];
  */
  const dash = "—";

  return (
    <section className={`tab${active ? " active" : ""}`} id="tab-profile" aria-label={t("profile")}>
      <div className="pcard">
        <div className="avatar" aria-hidden="true"><Icon name="user" /></div>
        <h2>{profile?.name || t("pTitle")}</h2>
        {profile?.mobile_number && <p>{fmtMobile(profile.mobile_number)}</p>}
        {/* City/location is not stored by the backend (api_integration.md §7), so it is not shown. */}
      </div>
      <div className="stats">
        <div className="stat"><b>{formsCount ?? dash}</b><span>{t("pForms")}</span></div>
        <div className="stat"><b>{payment ? inr(payment.amount_balance) : dash}</b><span>{t("pBalance")}</span></div>
        <div className="stat"><b>{payment ? inr(payment.amount_withdrawn) : dash}</b><span>{t("pWith")}</span></div>
      </div>
      {/* Badges section hidden for now (kept for later; restore with the `badges` list above).
      <div className="sec-title">{t("badges")}</div>
      <div className="badges">
        {badges.map((b) => (
          <div className={`badge${b.on ? "" : " lock"}`} key={b.k}>
            <div className="bi"><Icon name={b.on ? b.ic : "shield"} /></div>
            {t(b.k)}
            <small>{b.on ? t("unlocked") : t("locked")}</small>
          </div>
        ))}
      </div>
      */}
      <div className="list">
        <div className="li"><span>{t("pUpi")}</span><span className="v">{upi || t("pNone")}</span></div>
        <div className="li">
          <span>{t("pLang")}</span>
          <div className="seg" role="group" aria-label={t("pLang")}>
            <button data-lang="en" aria-pressed={lang === "en"} className={lang === "en" ? "on" : ""} onClick={() => onLang("en")}>English</button>
            <button data-lang="hi" aria-pressed={lang === "hi"} className={lang === "hi" ? "on" : ""} onClick={() => onLang("hi")}>हिंदी</button>
            <button data-lang="mr" aria-pressed={lang === "mr"} className={lang === "mr" ? "on" : ""} onClick={() => onLang("mr")}>मराठी</button>
          </div>
        </div>
      </div>
      {/* Log out is back now that sign-in exists: it deletes the token (no logout endpoint). */}
      <button className="logout" onClick={onLogout}>{t("logout")}</button>
    </section>
  );
}
