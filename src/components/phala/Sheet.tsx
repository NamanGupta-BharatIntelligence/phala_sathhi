import type { ReactNode, RefObject } from "react";
import Icon from "./Icon";

type Props = {
  open: boolean;
  sheetRef: RefObject<HTMLDivElement | null>;
  bodyRef: RefObject<HTMLDivElement | null>;
  title: ReactNode;
  sub?: string;
  progress?: { pct: number; full: boolean; text: string } | null;
  body: ReactNode;
  foot: ReactNode;
  closeLabel: string;
  onClose: () => void;
  onBackdrop: () => void;
};

/** Bottom sheet shell. Always mounted so the slide transition can run both ways. */
export default function Sheet({
  open, sheetRef, bodyRef, title, sub, progress, body, foot, closeLabel, onClose, onBackdrop,
}: Props) {
  return (
    <div
      id="veil"
      className={open ? "open" : ""}
      onClick={(e) => { if (e.target === e.currentTarget) onBackdrop(); }}
    >
      <div id="sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby="shTitle" tabIndex={-1}>
        <div className="shh">
          <div id="shTitle">
            {title}
            {sub ? <p>{sub}</p> : null}
          </div>
          <button className="x" onClick={onClose} aria-label={closeLabel}><Icon name="close" /></button>
        </div>
        <div className={`prog${progress ? " show" : ""}`} id="shProg">
          <div
            className={`pbar${progress?.full ? " full" : ""}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress?.pct ?? 0}
          >
            <i style={{ width: `${progress?.pct ?? 0}%` }} />
          </div>
          <span>{progress?.text}</span>
        </div>
        <div id="shBody" ref={bodyRef}>{body}</div>
        <div id="shFoot">{foot}</div>
      </div>
    </div>
  );
}
