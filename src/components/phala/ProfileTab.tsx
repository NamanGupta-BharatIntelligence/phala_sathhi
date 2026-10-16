import { formsDone, inr } from "@/lib/phala/utils";
import type { AppState, IconName, Lang } from "@/lib/phala/types";
import Icon from "./Icon";

type Props = {
  active: boolean;
  lang: Lang;
  t: (k: string) => string;
  state: AppState;
  onLang: (l: Lang) => void;
  onLogout: () => void;
};

export default function ProfileTab({ active, lang, t, state, onLang, onLogout }: Props) {
  const forms = formsDone(state.done);
  const badges: { k: string; ic: IconName; on: boolean }[] = [
    { k: "b1", ic: "award", on: forms >= 1 },
    { k: "b2", ic: "coin", on: state.earned >= 10 },
    { k: "b3", ic: "bank", on: state.withdrawn > 0 },
  ];

  return (
    <section className={`tab${active ? " active" : ""}`} id="tab-profile" aria-label={t("profile")}>
      <div className="pcard">
        <div className="avatar" aria-hidden="true">{lang === "hi" ? "र" : "R"}</div>
        <h2>{t("pName")}</h2>
        <p>{t("pPhone")}</p>
        <p><Icon name="pin" /> {t("pCity")}</p>
      </div>
      <div className="stats">
        <div className="stat"><b>{forms}</b><span>{t("pForms")}</span></div>
        <div className="stat"><b>{inr(state.earned)}</b><span>{t("pEarned")}</span></div>
        <div className="stat"><b>{inr(state.withdrawn)}</b><span>{t("pWith")}</span></div>
      </div>
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
      <div className="list" style={{ marginTop: 20 }}>
        <div className="li"><span>{t("pUpi")}</span><span className="v">{state.upi || t("pNone")}</span></div>
        <div className="li">
          <span>{t("pLang")}</span>
          <div className="seg" role="group" aria-label={t("pLang")}>
            <button data-lang="en" aria-pressed={lang === "en"} className={lang === "en" ? "on" : ""} onClick={() => onLang("en")}>English</button>
            <button data-lang="hi" aria-pressed={lang === "hi"} className={lang === "hi" ? "on" : ""} onClick={() => onLang("hi")}>हिंदी</button>
          </div>
        </div>
      </div>
      <button className="logout" onClick={onLogout}>{t("logout")}</button>
    </section>
  );
}
