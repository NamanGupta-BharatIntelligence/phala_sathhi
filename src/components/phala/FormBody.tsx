import { pick } from "@/lib/phala/utils";
import type { Field, FieldStatus, Lang, Task } from "@/lib/phala/types";
import Icon from "./Icon";

type Props = {
  task: Task;
  lang: Lang;
  t: (k: string) => string;
  values: Record<string, string>;
  status: Record<string, FieldStatus>;
  shaking: Record<string, boolean>;
  onValue: (f: Field, value: string, commit: boolean) => void;
  onBlur: (f: Field, value: string) => void;
};

const isTextual = (f: Field) => f.type === "text" || f.type === "tel" || f.type === "number";

export default function FormBody({ task, lang, t, values, status, shaking, onValue, onBlur }: Props) {
  return (
    <>
      {task.fields.map((f) => {
        const v = values[f.k] ?? "";
        const st = status[f.k];
        const label = pick(lang, f.label);
        let control;
        switch (f.type) {
          case "select":
            control = (
              <select
                id={`f_${f.k}`}
                data-k={f.k}
                value={v}
                onChange={(e) => onValue(f, e.target.value, true)}
                onBlur={(e) => onBlur(f, e.target.value)}
              >
                <option value="">{t("select")}</option>
                {f.opts!.map((o, i) => <option key={i} value={i}>{pick(lang, o)}</option>)}
              </select>
            );
            break;
          case "rating":
            control = (
              <div className="rate" role="group" aria-labelledby={`l_${f.k}`} data-k={f.k}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    data-rate={n}
                    className={Number(v) >= n ? "on" : ""}
                    aria-label={`${n} / 5`}
                    onClick={() => onValue(f, String(n), true)}
                  >★</button>
                ))}
              </div>
            );
            break;
          case "yesno":
            control = (
              <div className="yn" role="group" aria-labelledby={`l_${f.k}`} data-k={f.k}>
                {(["1", "0"] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    data-yn={val}
                    className={v === val ? "on" : ""}
                    aria-pressed={v === val}
                    onClick={() => onValue(f, val, true)}
                  >{t(val === "1" ? "yes" : "no")}</button>
                ))}
              </div>
            );
            break;
          case "photo":
            control = (
              <button
                type="button"
                className={`photo${v === "1" ? " on" : ""}`}
                data-k={f.k}
                data-photo
                onClick={() => onValue(f, v === "1" ? "" : "1", true)}
              >
                <Icon name={v === "1" ? "check" : "camAdd"} />
                {t(v === "1" ? "photoAdded" : "addPhoto")}
              </button>
            );
            break;
          default:
            control = (
              <input
                id={`f_${f.k}`}
                data-k={f.k}
                type={f.type}
                inputMode={f.type === "tel" || f.type === "number" ? "numeric" : undefined}
                autoComplete="off"
                placeholder={f.ph ? pick(lang, f.ph) : undefined}
                value={v}
                onChange={(e) => onValue(f, e.target.value, false)}
                onBlur={(e) => onBlur(f, e.target.value)}
              />
            );
        }
        return (
          <div
            key={f.k}
            data-f={f.k}
            className={`fld${st?.ok ? " ok" : ""}${st?.err ? " bad" : ""}${shaking[f.k] ? " shake" : ""}`}
          >
            <label className="lbl" id={`l_${f.k}`} htmlFor={isTextual(f) || f.type === "select" ? `f_${f.k}` : undefined}>
              {label}
            </label>
            {control}
            <div className="err" role="alert">{st?.err}</div>
          </div>
        );
      })}
      <p className="note"><Icon name="shield" />{t("privacy")}</p>
    </>
  );
}
