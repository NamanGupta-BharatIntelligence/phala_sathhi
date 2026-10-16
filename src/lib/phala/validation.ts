import type { Field } from "./types";
import { fill } from "./utils";

export const isRequired = (f: Field) => f.required !== false;

/**
 * Validates one field value. Returns a translated error message, or "" when valid.
 * Empty optional fields are valid; extra rules only apply when there is a value.
 */
export function fieldError(f: Field, raw: string, t: (k: string) => string): string {
  const v = raw.trim();
  if (!v) return isRequired(f) ? t("req") : "";
  if (f.type === "tel" && !/^[6-9]\d{9}$/.test(v)) return t("badPhone");
  if (f.type === "number") {
    const n = Number(v);
    if (!(n > 0)) return t("badNum");
    if (f.min !== undefined && n < f.min) return fill(t("tooSmall"), { n: f.min });
    if (f.max !== undefined && n > f.max) return fill(t("tooBig"), { n: f.max });
  }
  if (f.minLength !== undefined && v.length < f.minLength) return fill(t("tooShort"), { n: f.minLength });
  if (f.maxLength !== undefined && v.length > f.maxLength) return fill(t("tooLong"), { n: f.maxLength });
  if (f.pattern && !new RegExp(f.pattern).test(v)) return t("badFormat");
  return "";
}
