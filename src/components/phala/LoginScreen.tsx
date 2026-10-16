"use client";

import { useRef, useState, type FormEvent } from "react";
import { ApiError, services, type ApiProfile } from "@/lib/phala/services";
import type { Lang } from "@/lib/phala/types";
import { useOnline } from "./hooks";

type Props = {
  lang: Lang;
  t: (k: string) => string;
  onLang: (l: Lang) => void;
  onSignedIn: (profile: ApiProfile) => void;
  /** Shown above the form, e.g. after the session was rejected by the server. */
  notice?: string;
};

const MOBILE_RE = /^[6-9]\d{9}$/;

/** Mobile number + password sign-in (POST /signin). No OTP, no signup. */
export default function LoginScreen({ lang, t, onLang, onSignedIn, notice }: Props) {
  const online = useOnline();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errM, setErrM] = useState("");
  const [errP, setErrP] = useState("");
  const [formErr, setFormErr] = useState("");
  const mRef = useRef<HTMLInputElement>(null);
  const pRef = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setFormErr("");
    const em = !mobile ? t("l_reqM") : MOBILE_RE.test(mobile) ? "" : t("badPhone");
    const ep = password ? "" : t("l_reqP");
    setErrM(em);
    setErrP(ep);
    if (em) return mRef.current?.focus();
    if (ep) return pRef.current?.focus();
    if (!online) return setFormErr(t("l_offline"));
    setBusy(true);
    try {
      const profile = await services.auth.signIn(mobile, password);
      onSignedIn(profile);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "INTERNAL";
      setFormErr(
        code === "INVALID_CREDENTIALS" ? t("l_invalid")
          : code === "BAD_REQUEST" ? t("l_bad")
          : code === "NETWORK" ? t("l_offline")
          : t("l_down"),
      );
      setBusy(false);
    }
  };

  const alert = !online ? t("l_offline") : formErr || notice || "";
  const offlineAlert = !online || formErr === t("l_offline");

  return (
    <div className="login">
      <section className="login-brand" aria-label="Phala Sathhi">
        <div className="login-top">
          <div className="login-lang" role="group" aria-label={t("pLang")}>
            {([["en", "EN"], ["hi", "हिंदी"], ["mr", "मराठी"]] as const).map(([l, label]) => (
              <button key={l} type="button" className={lang === l ? "on" : ""} aria-pressed={lang === l} onClick={() => onLang(l)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="login-name">
          <h1>Phala Sathhi</h1>
          <div className="login-hi">फला साथी</div>
          <p>{t("l_tag")}</p>
        </div>
      </section>

      <div className="login-main">
        <div className="login-card">
          <h2>{t("l_title")}</h2>
          <p className="login-sub">{t("l_sub")}</p>

          <form onSubmit={submit} noValidate>
            {alert && (
              <div className={`login-alert${offlineAlert ? " off" : ""}`} role="alert">
                <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5h.01" /></svg>
                <span>{alert}</span>
              </div>
            )}

            <div className={`login-fld${errM ? " bad" : ""}`}>
              <label className="lbl" htmlFor="login-mobile">{t("l_mobile")}</label>
              <div className="login-ctl">
                <span className="login-cc">+91</span>
                <input
                  id="login-mobile" ref={mRef} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10}
                  placeholder={t("l_mobilePh")} value={mobile} readOnly={busy}
                  aria-invalid={!!errM} aria-describedby="login-em"
                  onChange={(e) => { setMobile(e.target.value.replace(/\D/g, "").slice(0, 10)); if (errM) setErrM(""); }}
                />
              </div>
              <div className="err" id="login-em" role="alert">{errM}</div>
            </div>

            <div className={`login-fld${errP ? " bad" : ""}`}>
              <label className="lbl" htmlFor="login-password">{t("l_pass")}</label>
              <div className="login-ctl">
                <input
                  id="login-password" ref={pRef} type={shown ? "text" : "password"} autoComplete="current-password"
                  placeholder={t("l_passPh")} value={password} readOnly={busy}
                  aria-invalid={!!errP} aria-describedby="login-ep"
                  onChange={(e) => { setPassword(e.target.value); if (errP) setErrP(""); }}
                />
                <button
                  type="button" className="login-eye" aria-pressed={shown}
                  aria-label={shown ? t("l_hide") : t("l_show")} onClick={() => setShown((v) => !v)}
                >
                  {shown ? (
                    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 5.1A10.9 10.9 0 0112 5c6.5 0 10 7 10 7a17.6 17.6 0 01-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.6-.6 5-1.5" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></svg>
                  ) : (
                    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
              <div className="err" id="login-ep" role="alert">{errP}</div>
            </div>

            <button className="btn gold block login-btn" type="submit" disabled={busy}>
              {busy ? <><span className="spin" />{t("l_busy")}</> : t("l_btn")}
            </button>
            <p className="login-slow" aria-live="polite">{busy ? t("l_slow") : ""}</p>
          </form>
        </div>
      </div>
    </div>
  );
}
