"use client";

import { useCallback, useRef, useState } from "react";
import { fieldError } from "@/lib/phala/validation";
import type { Field, FieldStatus, Task } from "@/lib/phala/types";

export type SubmitPhase = "idle" | "submitting" | "error";

/**
 * State for one task form: values, per-field status, shake feedback, drafts and submit phase.
 * No API calls here; the caller performs the submission and reports the phase.
 */
export function useTaskForm(task: Task | null, t: (k: string) => string) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, FieldStatus>>({});
  const [shaking, setShaking] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<SubmitPhase>("idle");
  const shakeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const setErr = useCallback((key: string, msg: string, value: string) => {
    setStatus((p) => ({ ...p, [key]: { err: msg, ok: !msg && value.trim() !== "" } }));
    if (msg) {
      setShaking((p) => ({ ...p, [key]: true }));
      clearTimeout(shakeTimers.current[key]);
      shakeTimers.current[key] = setTimeout(() => setShaking((p) => ({ ...p, [key]: false })), 320);
    }
  }, []);

  /** Validate one field. Without `force`, an empty field just clears its error (e.g. on blur). */
  const checkField = (key: string, value: string, force: boolean) => {
    const f = task?.fields.find((x) => x.k === key);
    if (!f) return;
    if (!value.trim() && !force) return setErr(key, "", value);
    setErr(key, fieldError(f, value, t), value);
  };

  const onValue = (f: Field, value: string, commit: boolean) => {
    setValues((p) => ({ ...p, [f.k]: value }));
    if (commit) {
      // select: validate now; rating/yes-no/photo: a tap always gives a valid value
      if (f.type === "select") checkField(f.k, value, true);
      else setErr(f.k, "", value);
    } else if (status[f.k]?.err) {
      checkField(f.k, value, true);
    }
  };

  /** Load a saved draft (or start empty). Filled fields show as already valid. */
  const load = (draft: Record<string, string>) => {
    setValues(draft);
    const restored: Record<string, FieldStatus> = {};
    for (const [k, v] of Object.entries(draft)) if (v.trim() !== "") restored[k] = { err: "", ok: true };
    setStatus(restored);
    setShaking({});
    setPhase("idle");
  };

  /** Validate every field; returns the key of the first invalid field, or null. */
  const validateAll = (): string | null => {
    if (!task) return null;
    let first: string | null = null;
    for (const f of task.fields) {
      const v = values[f.k] ?? "";
      const e = fieldError(f, v, t);
      setErr(f.k, e, v);
      if (e && !first) first = f.k;
    }
    return first;
  };

  const filledCount = task ? task.fields.filter((f) => (values[f.k] ?? "").trim() !== "").length : 0;

  return { values, status, shaking, phase, setPhase, filledCount, checkField, onValue, load, validateAll };
}
