export type Lang = "en" | "hi" | "mr";
export type TabId = "tasks" | "pay" | "profile" | "detail";

export type IconName =
  | "card" | "shop" | "camera" | "bank" | "doc" | "coin" | "pin" | "clock"
  | "shield" | "award" | "target" | "download" | "check" | "close" | "camAdd"
  | "back" | "list" | "bag" | "bulb" | "play" | "user" | "refresh" | "mic";

export type Localized = { en: string; hi: string; mr: string };

export type Field = {
  k: string;
  type: "text" | "tel" | "number" | "select" | "rating" | "yesno" | "photo" | "audio";
  label: Localized;
  ph?: Localized;
  opts?: Localized[];
  demo: string | number;
  /** Defaults to true. Optional fields may be left empty. */
  required?: boolean;
  /** Optional field shown without the "(optional)" marker. */
  quietOptional?: boolean;
  /** Extra validation rules (all optional; applied only when the field has a value). */
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  /** Regular expression source the trimmed value must match. */
  pattern?: string;
};

export type Task = {
  id: string;
  ic: IconName;
  bg: string;
  fg: string;
  title: Localized;
  desc: Localized;
  meta: Localized;
  fields: Field[];
  /** Exact `task` string from GET /tasks; sent back in POST /form. Absent for local-only data. */
  apiName?: string;
  /** short_description / full_description from GET /tasks (English, from the sheet). */
  apiShort?: string;
  apiFull?: string;
};

/** Content for a task's details page. */
export type TaskInfo = {
  steps: Localized[];
  need: Localized[];
  tip: Localized;
  /** Shown on the details page only when present. */
  restrictions?: Localized[];
};

/** An accepted task that has not been submitted yet, with its saved form answers. */
export type ActiveTask = { ts: number; draft: Record<string, string> };

/** A submitted form (GET /forms). Forms carry no amount: the server does not credit money. */
export type WorkEntry = { type: "work"; id: string; task: string; ts: number };
/** A withdrawal request (GET /withdrawals). Only "paid" from the server shows as paid. */
export type WithdrawEntry = { type: "wd"; id: string; ts: number; amt: number; upi: string; status: "pending" | "paid" };
export type HistoryEntry = WorkEntry | WithdrawEntry;

/** UI state only. Account data (profile, wallet, history) comes from the API, not from here. */
export type AppState = {
  /** Accepted, not yet submitted tasks (task id → draft). Kept on this device; no API for it. */
  active: Record<string, ActiveTask>;
  /** Task shown on the details page. */
  detail: string | null;
  lang: Lang;
  tab: TabId;
  unseen: boolean;
};

export type SheetState =
  | { kind: "form"; taskId: string }
  | { kind: "withdraw"; amount: number; min: number };

export type FieldStatus = { err: string; ok: boolean };

/** Chrome's non-standard install prompt event. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
