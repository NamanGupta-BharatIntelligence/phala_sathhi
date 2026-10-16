export type Lang = "en" | "hi";
export type TabId = "tasks" | "pay" | "profile";

export type IconName =
  | "card" | "shop" | "camera" | "bank" | "doc" | "coin" | "pin" | "clock"
  | "shield" | "award" | "target" | "download" | "check" | "close" | "camAdd";

export type Localized = { en: string; hi: string };

export type Field = {
  k: string;
  type: "text" | "tel" | "number" | "select" | "rating" | "yesno" | "photo";
  label: Localized;
  ph?: Localized;
  opts?: Localized[];
  demo: string | number;
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
};

export type WorkEntry = { type: "work"; id: number; task: string; ts: number; amt: number };
export type WithdrawEntry = {
  type: "wd";
  id: number;
  ts: number;
  amt: number;
  upi: string;
  status: "pending" | "paid";
};
export type HistoryEntry = WorkEntry | WithdrawEntry;

export type AppState = {
  earned: number;
  withdrawn: number;
  history: HistoryEntry[];
  done: Record<string, number>;
  upi: string;
  lang: Lang;
  tab: TabId;
  unseen: boolean;
};

export type SheetState =
  | { kind: "form"; taskId: string }
  | { kind: "withdraw"; amount: number };

export type FieldStatus = { err: string; ok: boolean };

/** Chrome's non-standard install prompt event. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
