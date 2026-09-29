import type { HeatLabel, HeatResult } from "@/lib/heat";

/**
 * Renders the computed Grove Heat / Momentum state (issue #21, ADR-004) as
 * docs/design/DESIGN-SYSTEM.md's Momentum/Heat component contract
 * specifies: icon + label + text-color pairing using the reserved
 * `momentum-*` tokens (never the generic `success`/`warning` tokens
 * StatusChip uses for the unrelated editorial `status` field). The
 * 🔥/🟢/🟡/⚪ icon set here is spec-locked (DESIGN-SYSTEM.md's Open
 * questions: "the one place emoji-as-icon is already spec'd and stays
 * as-is") — issue #52's icon-collision with StatusChip was resolved by
 * changing StatusChip's icon shape instead (a square swatch, not a dot),
 * not this component. See
 * docs/design/findings/UX-2026-003-status-momentum-chip-icon-collision.md.
 *
 * The underlying signals (star growth, open issues, contributor growth)
 * are exposed via the native `title` tooltip for now — a real
 * hover/expand affordance is a design-lane UI decision the DESIGN-SYSTEM.md
 * contract calls for but doesn't itself specify a mechanism for; this
 * satisfies "inspectable, not just the badge alone" without deciding that
 * design on this lane's behalf.
 */
const HEAT_CONFIG: Record<HeatLabel, { icon: string; label: string; textClassName: string }> = {
  rising: { icon: "🔥", label: "Rising", textClassName: "text-momentum-rising" },
  active: { icon: "🟢", label: "Active", textClassName: "text-momentum-active" },
  slowing: { icon: "🟡", label: "Slowing", textClassName: "text-momentum-slowing" },
  dormant: { icon: "⚪", label: "Dormant", textClassName: "text-momentum-dormant" },
};

export default function MomentumChip({ heat }: { heat: HeatResult }) {
  const config = HEAT_CONFIG[heat.label];
  const signalSummary = heat.signals
    .map((signal) => `${signal.label}: ${signal.available ? signal.detail : "not enough data yet"}`)
    .join(" · ");

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-subtle p-2 text-sm font-medium leading-none ${config.textClassName}`}
      title={signalSummary}
    >
      {/* Icon is decorative — the text label is what a screen reader
          announces; color/icon alone is never the only signal (WCAG 1.4.1),
          same convention as StatusChip. */}
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}
