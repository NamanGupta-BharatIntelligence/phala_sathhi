import { FEE, GOAL, RING, TASKS } from "@/lib/phala/data";
import { fill, inr, pick } from "@/lib/phala/utils";
import type { Lang } from "@/lib/phala/types";
import AnimatedRupees from "./AnimatedRupees";
import Icon from "./Icon";

type Props = {
  active: boolean;
  lang: Lang;
  t: (k: string) => string;
  earned: number;
  done: Record<string, number>;
  hour: number;
  showInstall: boolean;
  canInstall: boolean;
  onInstall: () => void;
  onHideInstall: () => void;
  onAccept: (id: string) => void;
};

export default function TasksTab({
  active, lang, t, earned, done, hour, showInstall, canInstall, onInstall, onHideInstall, onAccept,
}: Props) {
  const left = Math.max(GOAL - earned, 0);
  const ofGoal = fill(t("ofGoal"), { g: GOAL });
  const offset = RING * (1 - Math.min(earned / GOAL, 1));
  const greeting = hour < 0 ? "" : t(hour < 12 ? "greetM" : hour < 17 ? "greetA" : "greetE") + ", ";

  return (
    <section className={`tab${active ? " active" : ""}`} id="tab-tasks" aria-label={t("tasks")}>
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

      <div className="sec-title">{t("avail")}</div>
      {TASKS.map((k) => (
        <article className="task" key={k.id}>
          <div className="top">
            <div className="ti" style={{ background: k.bg, color: k.fg }}><Icon name={k.ic} /></div>
            <div>
              <h3>{pick(lang, k.title)}</h3>
              <p>{pick(lang, k.desc)}</p>
            </div>
          </div>
          <div className="chips">
            <span className="pay">{inr(FEE)} {t("perForm")}</span>
            <span className="chip2"><Icon name="clock" />{pick(lang, k.meta)}</span>
            {done[k.id] ? (
              <span className="cnt"><Icon name="check" />{fill(t("doneN"), { n: done[k.id] })}</span>
            ) : null}
          </div>
          <button className="btn teal block" data-accept={k.id} onClick={() => onAccept(k.id)}>
            {t("accept")}<span className="sr"> · {pick(lang, k.title)}</span>
          </button>
        </article>
      ))}
    </section>
  );
}
