"use client";

import { useCallback, useRef, type RefObject } from "react";
import { findTask } from "@/lib/phala/utils";
import type { Field } from "@/lib/phala/types";

type Api = {
  cursorRef: RefObject<HTMLDivElement | null>;
  /** Reset everything to the initial state. */
  reset: () => void;
  setRunning: (v: boolean) => void;
  setCaption: (key: string | null) => void;
  /** Re-validate a field using a value the demo just typed. */
  checkField: (key: string, value: string) => void;
};

class Cancelled extends Error {}

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel)!;

/** React ignores `el.value = x`; go through the native setter so onChange fires. */
function setNativeValue(el: HTMLInputElement | HTMLSelectElement, value: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
}

/**
 * Scripted walkthrough: a fake cursor drives the real UI through DOM clicks/typing,
 * so the demo exercises exactly the code paths a user would.
 */
export function useDemo({ cursorRef, reset, setRunning, setCaption, checkField }: Api) {
  const token = useRef(0);

  const sleep = useCallback((ms: number) => {
    const my = token.current;
    return new Promise<void>((res, rej) =>
      setTimeout(() => (my === token.current ? res() : rej(new Cancelled())), ms),
    );
  }, []);

  const cancel = useCallback(() => {
    token.current++;
    cursorRef.current?.classList.remove("show");
  }, [cursorRef]);

  const moveTo = useCallback(async (el: HTMLElement) => {
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    await sleep(500);
    const r = el.getBoundingClientRect();
    const c = cursorRef.current!;
    c.classList.add("show");
    c.style.transform = `translate(${r.left + r.width / 2 - 11}px,${r.top + r.height / 2 - 11}px)`;
    await sleep(700);
  }, [cursorRef, sleep]);

  const tap = useCallback(async (el: HTMLElement) => {
    await moveTo(el);
    const c = cursorRef.current!;
    const r = el.getBoundingClientRect();
    c.classList.add("down");
    await sleep(170);
    c.classList.remove("down");
    const rp = document.createElement("div");
    rp.className = "ripple";
    rp.style.left = r.left + r.width / 2 + "px";
    rp.style.top = r.top + r.height / 2 + "px";
    document.body.appendChild(rp);
    setTimeout(() => rp.remove(), 600);
    el.click();
    await sleep(400);
  }, [cursorRef, moveTo, sleep]);

  const typeInto = useCallback(async (el: HTMLInputElement, text: string) => {
    el.classList.add("typing");
    for (const ch of text) {
      setNativeValue(el, el.value + ch);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(55);
    }
    el.classList.remove("typing");
  }, [sleep]);

  const fillForm = useCallback(async (taskId: string) => {
    for (const f of findTask(taskId).fields as Field[]) {
      const el = $(`#shBody [data-k="${f.k}"]`);
      if (f.type === "select") {
        await moveTo(el);
        setNativeValue(el as HTMLSelectElement, String(f.demo));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        await sleep(550);
      } else if (f.type === "rating") await tap($(`[data-rate="${f.demo}"]`, el));
      else if (f.type === "yesno") await tap($(`[data-yn="${f.demo}"]`, el));
      else if (f.type === "photo") await tap(el);
      else {
        await moveTo(el);
        await typeInto(el as HTMLInputElement, String(f.demo));
        checkField(f.k, (el as HTMLInputElement).value);
        await sleep(250);
      }
    }
  }, [checkField, moveTo, sleep, tap, typeInto]);

  const run = useCallback(async () => {
    cancel();
    reset();
    setRunning(true);
    const id = token.current;
    try {
      await sleep(500);
      setCaption("c_welcome");
      await sleep(2600);

      for (const [tid, cap] of [["card", "c_accept1"], ["survey", "c_accept2"]]) {
        setCaption(cap);
        await tap($(`[data-detail="${tid}"]`));
        await sleep(1200);
        await tap($(`#tab-detail [data-accept="${tid}"]`));
        await sleep(500);
        setCaption("c_fill");
        await fillForm(tid);
        setCaption("c_submit");
        await tap($("#submitForm"));
        await sleep(2200);
      }

      setCaption("c_pay");
      await tap($('nav [data-nav="pay"]'));
      await sleep(2200);
      setCaption("c_hist");
      await sleep(2400);

      setCaption("c_withdraw");
      await tap($(".wbtn"));
      await sleep(500);
      const upi = $<HTMLInputElement>('#shBody [data-k="upi"]');
      await moveTo(upi);
      await typeInto(upi, "saathi.demo@upi");
      await sleep(300);
      setCaption("c_verify");
      await tap($("#confirmW"));
      await sleep(2000);
      await tap($("#confirmW"));
      await sleep(2800);
      setCaption("c_wstatus");
      await sleep(5200);

      setCaption("c_profile");
      await tap($('nav [data-nav="profile"]'));
      await sleep(2400);
      setCaption("c_badges");
      await sleep(2600);
      setCaption("c_lang");
      await tap($('[data-lang="hi"]'));
      await sleep(2800);
      setCaption("c_done");
      await sleep(3200);
    } catch (err) {
      if (!(err instanceof Cancelled)) console.error(err);
    } finally {
      if (token.current === id) {
        setRunning(false);
        cursorRef.current?.classList.remove("show");
        setTimeout(() => { if (token.current === id) setCaption(null); }, 600);
      }
    }
  }, [cancel, cursorRef, fillForm, moveTo, reset, setCaption, setRunning, sleep, tap, typeInto]);

  return { run, cancel };
}
