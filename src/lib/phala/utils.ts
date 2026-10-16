import { TASKS, T } from "./data";
import type { AppState, Lang, Localized, Task } from "./types";

export const initialState = (): AppState => ({
  earned: 0,
  withdrawn: 0,
  history: [],
  done: {},
  upi: "",
  lang: "en",
  tab: "tasks",
  unseen: false,
});

export const translate = (lang: Lang, key: string) => T[lang][key] ?? T.en[key] ?? key;
export const pick = (lang: Lang, o: Localized) => o[lang] || o.en;
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

export const inr = (n: number) => "₹" + Number(n).toLocaleString("en-IN");
export const when = (ts: number, lang: Lang) =>
  new Date(ts).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

export const findTask = (id: string): Task => TASKS.find((x) => x.id === id)!;
export const formsDone = (done: Record<string, number>) =>
  Object.values(done).reduce((a, b) => a + b, 0);

export const buzz = (pattern: number | number[] = 12) => {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* vibration unsupported */
  }
};

export const sleepMs = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
