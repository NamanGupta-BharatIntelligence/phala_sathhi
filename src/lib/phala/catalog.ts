import { GENERIC_FIELDS, TASKS } from "./data";
import type { ApiTask } from "./services/types";
import type { Lang, Task } from "./types";
import { pick } from "./utils";

/**
 * Joins GET /tasks rows with the form definitions kept in the frontend (api_integration.md,
 * open point 1). The sheet has only task / short_description / full_description, so fields,
 * icon, colours and Hindi/Marathi text stay local, matched by the task name (case/space-insensitive).
 */
const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

const LOCAL_BY_NAME = new Map(TASKS.map((t) => [norm(t.title.en), t] as const));

/** Builds the visible task list from the API rows. Unknown tasks get the same form and a neutral look. */
export function mapApiTasks(rows: ApiTask[]): Task[] {
  const seen = new Set<string>();
  const out: Task[] = [];
  for (const r of rows) {
    const name = (r.task ?? "").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const local = LOCAL_BY_NAME.get(norm(name));
    const extra = { apiName: name, apiShort: r.short_description || "", apiFull: r.full_description || "" };
    // Every task uses the same form (name, phone, audio, photo).
    if (local) {
      out.push({ ...local, ...extra, fields: GENERIC_FIELDS });
    } else {
      out.push({
        id: `api:${name}`,
        ic: "doc",
        bg: "#EEF3F4",
        fg: "#0A6A73",
        title: { en: name, hi: name, mr: name },
        desc: { en: extra.apiShort, hi: extra.apiShort, mr: extra.apiShort },
        meta: { en: "", hi: "", mr: "" },
        fields: GENERIC_FIELDS,
        ...extra,
      });
    }
  }
  return out;
}

/** Short description: the sheet's text in English; the local translation in Hindi/Marathi when known. */
export function taskDesc(task: Task, lang: Lang): string {
  if (lang === "en") return task.apiShort || task.desc.en;
  return task.id.startsWith("api:") ? task.apiShort || "" : pick(lang, task.desc);
}

export const hasForm = (task: Task) => task.fields.length > 0;

/** Display name for a task string from history (GET /forms). */
export function taskLabel(apiName: string, lang: Lang, tasks: Task[]): string {
  const t = tasks.find((x) => x.apiName === apiName) ?? LOCAL_BY_NAME.get(norm(apiName));
  return t ? pick(lang, t.title) : apiName;
}

/** Local look (icon/colours) for a task string from history. */
export function taskLook(apiName: string, tasks: Task[]) {
  const t = tasks.find((x) => x.apiName === apiName) ?? LOCAL_BY_NAME.get(norm(apiName));
  return t ? { ic: t.ic, bg: t.bg, fg: t.fg } : { ic: "doc" as const, bg: "#EEF3F4", fg: "#0A6A73" };
}
