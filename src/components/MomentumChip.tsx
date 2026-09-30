"use client";

import { useId, useState } from "react";
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
 * were previously exposed via the native `title` tooltip only — which
 * satisfies DESIGN-SYSTEM.md's "inspectable, not just the badge alone"
 * requirement for a mouse, but not reliably for a keyboard or touch user
 * (no `title` on most touchscreens, and it's never in the tab order) or a
 * screen reader (announcement of `title` on a non-interactive `<span>` is
 * inconsistent across screen readers, and nothing told one it existed at
 * all). See TECH-DEBT.md's 2026-09-29 "design" row and
 * docs/design/findings/UX-2026-005-momentum-chip-tooltip-accessibility.md.
 *
 * Fixed here with the WAI-ARIA "disclosure (show/hide)" pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/): the chip itself
 * becomes a real `<button>` (reachable by Tab, activated by Enter/Space,
 * and by tap on touch — all for free from the native element, no custom
 * key handling needed) with `aria-expanded`/`aria-controls` pointing at a
 * signal panel that's always in the DOM (so `aria-controls`'s target always
 * resolves) but hidden via the `hidden` attribute until expanded — the same
 * "structured facts, not a hover-only aside" convention the rest of this
 * product uses for showing trade-offs (spec §4).
 */
const HEAT_CONFIG: Record<HeatLabel, { icon: string; label: string; textClassName: string }> = {
  rising: { icon: "🔥", label: "Rising", textClassName: "text-momentum-rising" },
  active: { icon: "🟢", label: "Active", textClassName: "text-momentum-active" },
  slowing: { icon: "🟡", label: "Slowing", textClassName: "text-momentum-slowing" },
  dormant: { icon: "⚪", label: "Dormant", textClassName: "text-momentum-dormant" },
};

export default function MomentumChip({ heat }: { heat: HeatResult }) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const config = HEAT_CONFIG[heat.label];

  return (
    <span className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((value) => !value)}
        className={`inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-subtle p-2 text-sm font-medium leading-none ${config.textClassName} hover:bg-bg-elevated focus:outline-none focus:ring-2 focus:ring-cta-fill focus:ring-offset-2`}
      >
        {/* Icon is decorative — the text label is what a screen reader
            announces; color/icon alone is never the only signal (WCAG
            1.4.1), same convention as StatusChip. */}
        <span aria-hidden="true">{config.icon}</span>
        {config.label}
        {/* The chevron is decorative (aria-expanded on the button already
            tells assistive tech open/closed state); the trailing sr-only
            text gives every user, not just sighted mouse users, a reason
            to activate the button before they do. */}
        <span aria-hidden="true" className="text-text-secondary">
          {expanded ? "▲" : "▼"}
        </span>
        <span className="sr-only">
          {expanded ? " — hide momentum signals" : " — show momentum signals"}
        </span>
      </button>
      <dl
        id={panelId}
        hidden={!expanded}
        data-testid="momentum-signal-panel"
        className="flex flex-col gap-1 rounded-sm border border-border-subtle bg-bg-elevated p-3 font-sans text-xs text-text-secondary"
      >
        {heat.signals.map((signal) => (
          <div key={signal.key} className="flex gap-2">
            <dt className="font-medium text-text-default">{signal.label}:</dt>
            <dd>{signal.available ? signal.detail : "not enough data yet"}</dd>
          </div>
        ))}
      </dl>
    </span>
  );
}
