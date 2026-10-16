import { useEffect, useMemo, useRef } from "react";
import { media } from "@/lib/phala/media";
import { pick } from "@/lib/phala/utils";
import type { Field, Lang } from "@/lib/phala/types";
import Icon from "../Icon";

/** Props shared by every field control. Controls are presentational: no validation, no API calls. */
export type FieldControlProps = {
  f: Field;
  lang: Lang;
  t: (k: string) => string;
  value: string;
  /** `commit` = a tap-style or select change that should be validated right away. */
  onValue: (f: Field, value: string, commit: boolean) => void;
  onBlur: (f: Field, value: string) => void;
  /** Key for photo/audio files in the on-device media store ("<taskId>:<fieldKey>"). */
  mediaKey: string;
};

function TextField({ f, lang, value, onValue, onBlur }: FieldControlProps) {
  return (
    <input
      id={`f_${f.k}`}
      data-k={f.k}
      type={f.type}
      inputMode={f.type === "tel" || f.type === "number" ? "numeric" : undefined}
      autoComplete="off"
      placeholder={f.ph ? pick(lang, f.ph) : undefined}
      value={value}
      onChange={(e) => onValue(f, e.target.value, false)}
      onBlur={(e) => onBlur(f, e.target.value)}
    />
  );
}

function SelectField({ f, lang, t, value, onValue, onBlur }: FieldControlProps) {
  return (
    <select
      id={`f_${f.k}`}
      data-k={f.k}
      value={value}
      onChange={(e) => onValue(f, e.target.value, true)}
      onBlur={(e) => onBlur(f, e.target.value)}
    >
      <option value="">{t("select")}</option>
      {(f.opts ?? []).map((o, i) => <option key={i} value={i}>{pick(lang, o)}</option>)}
    </select>
  );
}

function RatingField({ f, value, onValue }: FieldControlProps) {
  return (
    <div className="rate" role="group" aria-labelledby={`l_${f.k}`} data-k={f.k}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          data-rate={n}
          className={Number(value) >= n ? "on" : ""}
          aria-label={`${n} / 5`}
          onClick={() => onValue(f, String(n), true)}
        >★</button>
      ))}
    </div>
  );
}

function YesNoField({ f, t, value, onValue }: FieldControlProps) {
  return (
    <div className="yn" role="group" aria-labelledby={`l_${f.k}`} data-k={f.k}>
      {(["1", "0"] as const).map((val) => (
        <button
          key={val}
          type="button"
          data-yn={val}
          className={value === val ? "on" : ""}
          aria-pressed={value === val}
          onClick={() => onValue(f, val, true)}
        >{t(val === "1" ? "yes" : "no")}</button>
      ))}
    </div>
  );
}

/** Object URL for a stored file, revoked when it changes or the field unmounts. */
function useFileUrl(key: string, value: string) {
  const url = useMemo(() => {
    const file = value === "1" ? media.get(key) : undefined;
    return file ? URL.createObjectURL(file) : "";
  }, [key, value]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

/** Photo from the camera or gallery. The file stays on this device; the form value is "1" when attached. */
function PhotoField({ f, t, value, onValue, mediaKey }: FieldControlProps) {
  const input = useRef<HTMLInputElement>(null);
  const url = useFileUrl(mediaKey, value);
  const pickFile = (file?: File) => {
    if (!file) return;
    media.set(mediaKey, file);
    onValue(f, "1", true);
  };
  const remove = () => { media.delete(mediaKey); onValue(f, "", true); };
  return (
    <>
      <input
        ref={input} type="file" accept="image/*" hidden data-k={f.k} data-photo-input
        onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }}
      />
      {url ? (
        <div className="media-prev">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={t("photoAdded")} />
          <button type="button" className="media-x" onClick={remove}><Icon name="close" />{t("remove")}</button>
        </div>
      ) : (
        <button type="button" className="photo" data-k={f.k} data-photo onClick={() => input.current?.click()}>
          <Icon name="camAdd" />{t("addPhoto")}
        </button>
      )}
    </>
  );
}

/** Audio file picked from the phone (voice note, recording app, WhatsApp audio…). Kept on this device until submit. */
function AudioField({ f, t, value, onValue, mediaKey }: FieldControlProps) {
  const input = useRef<HTMLInputElement>(null);
  const url = useFileUrl(mediaKey, value);
  const attach = (file?: File) => {
    if (!file) return;
    media.set(mediaKey, file);
    onValue(f, "1", true);
  };
  const remove = () => { media.delete(mediaKey); onValue(f, "", true); };
  return (
    <>
      <input
        ref={input} type="file" accept="audio/*" hidden data-k={f.k} data-audio-input
        onChange={(e) => { attach(e.target.files?.[0]); e.target.value = ""; }}
      />
      {url ? (
        <div className="media-prev">
          <audio src={url} controls preload="metadata" aria-label={t("audioAdded")} />
          <button type="button" className="media-x" onClick={remove}><Icon name="close" />{t("remove")}</button>
        </div>
      ) : (
        <button type="button" className="photo" data-k={f.k} data-audio onClick={() => input.current?.click()}>
          <Icon name="mic" />{t("upAudio")}
        </button>
      )}
    </>
  );
}

const CONTROLS: Record<Field["type"], (p: FieldControlProps) => React.ReactNode> = {
  text: TextField,
  tel: TextField,
  number: TextField,
  select: SelectField,
  rating: RatingField,
  yesno: YesNoField,
  photo: PhotoField,
  audio: AudioField,
};

/** Renders the right control for a field's type. Add new types here. */
export function FieldControl(props: FieldControlProps) {
  const Control = CONTROLS[props.f.type];
  return <Control {...props} />;
}

/** Field types whose <label> can point at a single focusable element. */
export const hasLabelTarget = (f: Field) =>
  f.type === "text" || f.type === "tel" || f.type === "number" || f.type === "select";
