import { INFO } from "@/lib/phala/data";
import { hasForm, taskDesc } from "@/lib/phala/catalog";
import { fill, pick } from "@/lib/phala/utils";
import type { ActiveTask, Lang, Task } from "@/lib/phala/types";
import Icon from "./Icon";

type Props = {
  active: boolean;
  lang: Lang;
  t: (k: string) => string;
  task: Task | null;
  /** Present when this task was accepted and not yet submitted. */
  progress: ActiveTask | undefined;
  filled: number;
  doneCount: number;
  /** True while the accept request is in flight. */
  accepting: boolean;
  onBack: () => void;
  onAccept: (id: string) => void;
};

/** Task details page: what to do, what to keep ready, fields, tip, then Accept & start. */
export default function TaskDetail({ active, lang, t, task, progress, filled, doneCount, accepting, onBack, onAccept }: Props) {
  if (!task) return <section className={`tab${active ? " active" : ""}`} id="tab-detail" />;
  const info = INFO[task.id];
  const total = task.fields.length;

  return (
    <section className={`tab${active ? " active" : ""}`} id="tab-detail" aria-label={pick(lang, task.title)}>
      <button className="back" data-nav="tasks" onClick={onBack}>
        <Icon name="back" />{t("back")}
      </button>
      <div className="dhero">
        <div className="ti" style={{ background: task.bg, color: task.fg }}><Icon name={task.ic} /></div>
        <h1>{pick(lang, task.title)}</h1>
        {taskDesc(task, lang) && <p>{taskDesc(task, lang)}</p>}
        {/* "₹5 per form" and duration badges removed; FEE and task.meta are kept in data. */}
        {(progress || doneCount) ? (
          <div className="chips">
            {progress && <span className="chip3"><Icon name="play" />{t("inProg")}</span>}
            {doneCount ? <span className="cnt"><Icon name="check" />{fill(t("doneN"), { n: doneCount })}</span> : null}
          </div>
        ) : null}
      </div>

      {task.apiFull ? (
        <div className="dsec">
          <h3><Icon name="doc" />{t("about")}</h3>
          <p className="about">{task.apiFull}</p>
        </div>
      ) : null}
      {info && (
        <>
          <div className="dsec">
            <h3><Icon name="list" />{t("whatDo")}</h3>
            <ol className="steps">
              {info.steps.map((s, i) => <li key={i}><b>{i + 1}</b><span>{pick(lang, s)}</span></li>)}
            </ol>
          </div>
          <div className="dsec">
            <h3><Icon name="bag" />{t("keepReady")}</h3>
            <ul className="need">
              {info.need.map((n, i) => <li key={i}><Icon name="check" />{pick(lang, n)}</li>)}
            </ul>
          </div>
        </>
      )}
      {info?.restrictions?.length ? (
        <div className="dsec">
          <h3><Icon name="shield" />{t("restrictions")}</h3>
          <ul className="need restr">
            {info.restrictions.map((r, i) => <li key={i}><Icon name="close" />{pick(lang, r)}</li>)}
          </ul>
        </div>
      ) : null}
      {hasForm(task) && (
        <div className="dsec">
          <h3><Icon name="doc" />{t("youFill")}</h3>
          <div className="ffl">{task.fields.map((f) => <span key={f.k}>{pick(lang, f.label)}</span>)}</div>
        </div>
      )}
      {info && (
        <div className="dsec">
          <h3><Icon name="bulb" />{t("goodKnow")}</h3>
          <div className="tipbox">{pick(lang, info.tip)}</div>
        </div>
      )}

      <div className="dfoot">
        {!hasForm(task) && <p className="noform" role="note">{t("noForm")}</p>}
        <button className="btn gold block" data-accept={task.id} disabled={accepting || !hasForm(task)} onClick={() => onAccept(task.id)}>
          {accepting
            ? <><span className="spin" />{t("acceptStart")}</>
            : progress
            ? `${t("continueF")} · ${fill(t("filledOf"), { n: filled, m: total })}`
            : t("acceptStart")}
        </button>
        {/* "₹5 is added to your wallet" removed: POST /form does not credit money (api_integration.md §2.5). */}
      </div>
    </section>
  );
}
