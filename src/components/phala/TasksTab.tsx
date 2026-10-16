// Used by the hidden greeting/earnings banner below; restore together with it.
// import { GOAL, RING } from "@/lib/phala/data";
// import AnimatedRupees from "./AnimatedRupees";
// import { inr } from "@/lib/phala/utils";
import { taskDesc } from "@/lib/phala/catalog";
import { fill, findTask, pick, when } from "@/lib/phala/utils";
import type { ActiveTask, Lang, Task } from "@/lib/phala/types";
import Icon from "./Icon";

export type TaskListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; tasks: Task[] };

type Props = {
  active: boolean;
  lang: Lang;
  t: (k: string) => string;
  /** Tasks available to the current Saathi, as loaded through the task service. */
  list: TaskListState;
  onRetry: () => void;
  earned: number;
  done: Record<string, number>;
  /** Accepted, not yet submitted tasks. */
  activeTasks: Record<string, ActiveTask>;
  /** Number of filled fields in a task's saved draft. */
  filledFor: (id: string) => number;
  hour: number;
  showInstall: boolean;
  canInstall: boolean;
  onInstall: () => void;
  onHideInstall: () => void;
  onAccept: (id: string) => void;
  onDetail: (id: string) => void;
};

export default function TasksTab({
  active, lang, t, list, onRetry, done, activeTasks, filledFor, onAccept, onDetail,
  // showInstall, canInstall, onInstall, onHideInstall: used by the hidden "Install the app" card below
}: Props) {
  /* Greeting/earnings banner is hidden for now. To restore: destructure `earned` and `hour`,
     uncomment these lines, the imports at the top and the banner JSX below.
  const left = Math.max(GOAL - earned, 0);
  const ofGoal = fill(t("ofGoal"), { g: GOAL });
  const offset = RING * (1 - Math.min(earned / GOAL, 1));
  const greeting = hour < 0 ? "" : t(hour < 12 ? "greetM" : hour < 17 ? "greetA" : "greetE") + ", ";
  */
  const tasks = list.status === "ready" ? list.tasks : [];
  const taskFor = (id: string) => tasks.find((x) => x.id === id) ?? findTask(id);

  return (
    <section className={`tab${active ? " active" : ""}`} id="tab-tasks" aria-label={t("tasks")}>
      {/* Greeting/earnings banner hidden for now (kept for later):
      <div className="banner">
        <div className="bn-row">
          <div>
            <h2>{greeting}{t("name")}</h2>
            <h1>{t("bannerT")}</h1>
            <p>{t("bannerS")}</p>
          </div>
          <div className="ring" role="img" aria-label={`${t("goal")}: ${inr(earned)} ${ofGoal}`}>
            <svg viewBox="0 0 88 88">
              <circle className="bg" cx="44" cy="44" r="34" />
              <circle className="fg" cx="44" cy="44" r="34" style={{ strokeDashoffset: offset }} />
            </svg>
            <div className="c">
              <b><AnimatedRupees value={earned} /></b>
              <small>{ofGoal}</small>
            </div>
          </div>
        </div>
        <div className="goal">
          <Icon name="target" />
          <span>{t("goal")}: {left ? fill(t("goalLeft"), { n: left }) : t("goalDone")}</span>
        </div>
      </div>
      */}

      {/* "Install the app" card hidden for now (kept for later; restore by destructuring
          showInstall, canInstall, onInstall and onHideInstall above).
      {showInstall && (
        <div className="install">
          <div className="ii"><Icon name="download" /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>{t("installT")}</h3>
            <p>{canInstall ? t("installS") : t("iosS")}</p>
          </div>
          {canInstall && <button className="btn teal" onClick={onInstall}>{t("installBtn")}</button>}
          <button className="xx" onClick={onHideInstall} aria-label={t("dismiss")}><Icon name="close" /></button>
        </div>
      )}
      */}

      {Object.keys(activeTasks).length > 0 && (
        <>
          <div className="sec-title">{t("myTasks")}</div>
          {Object.entries(activeTasks).map(([id, a]) => {
            const k = taskFor(id);
            if (!k) return null;
            const m = k.fields.length, n = filledFor(id);
            return (
              <div className="mine" key={id}>
                <div className="ti" style={{ background: k.bg, color: k.fg }}><Icon name={k.ic} /></div>
                <div className="m">
                  <h4>{pick(lang, k.title)}</h4>
                  <small>{fill(t("filledOf"), { n, m })} · {fill(t("accTime"), { t: when(a.ts, lang) })}</small>
                  <div className="pbar"><i style={{ width: `${Math.round((n / m) * 100)}%` }} /></div>
                </div>
                <button className="btn teal" data-accept={id} onClick={() => onAccept(id)}>{t("continueF")}</button>
              </div>
            );
          })}
        </>
      )}

      <div className="sec-title">{t("avail")}</div>

      {list.status === "loading" && (
        <div className="state" role="status" aria-live="polite"><span className="spin" />{t("loadingTasks")}</div>
      )}
      {list.status === "error" && (
        <div className="state bad" role="alert">
          <span>{t("tasksError")}</span>
          <button className="btn teal" onClick={onRetry}>{t("retry")}</button>
        </div>
      )}
      {list.status === "ready" && tasks.length === 0 && (
        <div className="empty">
          {t("noTasks")}
        </div>
      )}

      {tasks.map((k) => (
        <article className="task" key={k.id}>
          <div className="top">
            <div className="ti" style={{ background: k.bg, color: k.fg }}><Icon name={k.ic} /></div>
            <div>
              <h3>{pick(lang, k.title)}</h3>
              {taskDesc(k, lang) && <p>{taskDesc(k, lang)}</p>}
            </div>
          </div>
          {/* "₹5 per form" and duration badges removed from the card; FEE and task.meta are kept in data. */}
          {(activeTasks[k.id] || done[k.id]) ? (
            <div className="chips">
              {activeTasks[k.id] && <span className="chip3"><Icon name="play" />{t("inProg")}</span>}
              {done[k.id] ? (
                <span className="cnt"><Icon name="check" />{fill(t("doneN"), { n: done[k.id] })}</span>
              ) : null}
            </div>
          ) : null}
          <button className="btn teal block" data-detail={k.id} onClick={() => onDetail(k.id)}>
            {t("details")}<span className="sr"> · {pick(lang, k.title)}</span>
          </button>
        </article>
      ))}
    </section>
  );
}
