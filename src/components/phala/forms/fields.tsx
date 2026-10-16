import { pick } from "@/lib/phala/utils";
import type { Field, Lang } from "@/lib/phala/types";
import Icon from "../Icon";

/** Props shared by every field control. Controls are presentational: no validation, no API calls. */
export type FieldControlProps = {
  f: Field;
  lang: Lang;
  t: (k: string) => string;
  value: string;
  /** `commit` = a tap-style or select change that should be validated right away. */
  onValue: (f: Field, value: string, commit: boolean) => void;
  onBlur: (f: Field, value: string) => void;
};

function TextField({ f, lang, value, onValue, onBlur }: FieldControlProps) {
  return (
    <input
      id={`f_${f.k}`}
      data-k={f.k}
      type={f.type}
      inputMode={f.type === "tel" || f.type === "number" ? "numeric" : undefined}
      autoComplete="off"
      placeholder={f.ph ? pick(lang, f.ph) : undefined}
      value={value}
      onChange={(e) => onValue(f, e.target.value, false)}
      onBlur={(e) => onBlur(f, e.target.value)}
    />
  );
}

function SelectField({ f, lang, t, value, onValue, onBlur }: FieldControlProps) {
  return (
    <select
      id={`f_${f.k}`}
      data-k={f.k}
      value={value}
      onChange={(e) => onValue(f, e.target.value, true)}
      onBlur={(e) => onBlur(f, e.target.value)}
    >
      <option value="">{t("select")}</option>
      {(f.opts ?? []).map((o, i) => <option key={i} value={i}>{pick(lang, o)}</option>)}
    </select>
  );
}

function RatingField({ f, value, onValue }: FieldControlProps) {
  return (
    <div className="rate" role="group" aria-labelledby={`l_${f.k}`} data-k={f.k}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          data-rate={n}
          className={Number(value) >= n ? "on" : ""}
          aria-label={`${n} / 5`}
          onClick={() => onValue(f, String(n), true)}
        >★</button>
      ))}
    </div>
  );
}

function YesNoField({ f, t, value, onValue }: FieldControlProps) {
  return (
    <div className="yn" role="group" aria-labelledby={`l_${f.k}`} data-k={f.k}>
      {(["1", "0"] as const).map((val) => (
        <button
          key={val}
          type="button"
          data-yn={val}
          className={value === val ? "on" : ""}
          aria-pressed={value === val}
          onClick={() => onValue(f, val, true)}
        >{t(val === "1" ? "yes" : "no")}</button>
      ))}
    </div>
  );
}

/** Placeholder only: marks a photo as added. Real capture/upload waits for the backend contract. */
function PhotoField({ f, t, value, onValue }: FieldControlProps) {
  const on = value === "1";
  return (
    <button
      type="button"
      className={`photo${on ? " on" : ""}`}
      data-k={f.k}
      data-photo
      onClick={() => onValue(f, on ? "" : "1", true)}
    >
      <Icon name={on ? "check" : "camAdd"} />
      {t(on ? "photoAdded" : "addPhoto")}
    </button>
  );
}

const CONTROLS: Record<Field["type"], (p: FieldControlProps) => React.ReactNode> = {
  text: TextField,
  tel: TextField,
  number: TextField,
  select: SelectField,
  rating: RatingField,
  yesno: YesNoField,
  photo: PhotoField,
};

/** Renders the right control for a field's type. Add new types here. */
export function FieldControl(props: FieldControlProps) {
  const Control = CONTROLS[props.f.type];
  return <Control {...props} />;
}

/** Field types whose <label> can point at a single focusable element. */
export const hasLabelTarget = (f: Field) =>
  f.type === "text" || f.type === "tel" || f.type === "number" || f.type === "select";
