import { ICONS } from "@/lib/phala/data";
import type { IconName } from "@/lib/phala/types";

/** Inline SVG icon. Paths come from the static ICONS table, never user input. */
export default function Icon({ name, className = "ic" }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
