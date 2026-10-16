import { pick } from "@/lib/phala/utils";
import { isRequired } from "@/lib/phala/validation";
import type { Field, FieldStatus, Lang, Task } from "@/lib/phala/types";
import Icon from "../Icon";
import { FieldControl, hasLabelTarget } from "./fields";

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

/**
 * Renders any task form from its field configuration.
 * Purely presentational: state and validation live in `useTaskForm`, API calls in services.
 */
export default function TaskForm({ task, lang, t, values, status, shaking, onValue, onBlur }: Props) {
  return (
    <>
      {task.fields.map((f) => {
        const st = status[f.k];
        return (
          <div
            key={f.k}
            data-f={f.k}
            className={`fld${st?.ok ? " ok" : ""}${st?.err ? " bad" : ""}${shaking[f.k] ? " shake" : ""}`}
          >
            <label className="lbl" id={`l_${f.k}`} htmlFor={hasLabelTarget(f) ? `f_${f.k}` : undefined}>
              {pick(lang, f.label)}
              {!isRequired(f) && !f.quietOptional && <span className="opt"> ({t("optional")})</span>}
            </label>
            <FieldControl
              f={f} lang={lang} t={t} value={values[f.k] ?? ""} onValue={onValue} onBlur={onBlur}
              mediaKey={`${task.id}:${f.k}`}
            />
            <div className="err" role="alert">{st?.err}</div>
          </div>
        );
      })}
      <p className="note"><Icon name="shield" />{t("privacy")}</p>
    </>
  );
}
