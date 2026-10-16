"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** Browser-only facts, safe for SSR/hydration (server snapshot is a neutral default). */
export function useInstallEnv() {
  const key = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(display-mode: standalone)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      return `${standalone ? 1 : 0}${ios ? 1 : 0}`;
    },
    () => "00",
  );
  return { standalone: key[0] === "1", ios: key[1] === "1" };
}

export function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

/** Current local hour, or -1 on the server (greeting is rendered after hydration). */
export function useHour() {
  return useSyncExternalStore(
    noopSubscribe,
    () => new Date().getHours(),
    () => -1,
  );
}
