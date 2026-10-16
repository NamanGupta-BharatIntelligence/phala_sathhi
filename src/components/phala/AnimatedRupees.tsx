"use client";

import { useEffect, useRef, useState } from "react";
import { inr } from "@/lib/phala/utils";

/** Counts up to `value` (₹). Decreases (e.g. reset) apply instantly. */
export default function AnimatedRupees({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    const dur = value > from ? 750 : 0;
    const t0 = performance.now();
    let id = 0;
    const step = (now: number) => {
      const p = dur ? Math.min((now - t0) / dur, 1) : 1;
      const v = Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3)));
      shownRef.current = v;
      setShown(v);
      if (p < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value]);

  return <>{inr(shown)}</>;
}
