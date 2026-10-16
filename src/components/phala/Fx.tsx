import type { CSSProperties } from "react";
import Icon from "./Icon";

export type FxItem =
  | { id: number; kind: "coin"; text: string }
  | { id: number; kind: "petal"; color: string; dx: number; dy: number; rot: number };

/** Transient celebration effects, rendered inside the phone shell. */
export default function Fx({ items }: { items: FxItem[] }) {
  return (
    <>
      {items.map((f) =>
        f.kind === "coin" ? (
          <div className="coinfx" key={f.id}><Icon name="coin" />{f.text}</div>
        ) : (
          <i
            className="petal"
            key={f.id}
            style={{
              background: f.color,
              ["--dx" as string]: `${f.dx}px`,
              ["--dy" as string]: `${f.dy}px`,
              ["--rot" as string]: `${f.rot}deg`,
            } as CSSProperties}
          />
        ),
      )}
    </>
  );
}
