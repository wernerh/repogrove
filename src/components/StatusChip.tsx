import type { RepoStatus } from "@/lib/content";

/**
 * Renders a repo's editorial maintenance status (`content/repos/*.md`'s
 * `status` frontmatter field — active/maintained/inactive) as the "status
 * chip" pattern from docs/design/DESIGN-SYSTEM.md's Component patterns
 * section: icon + label + text-color pairing (never a filled color block
 * with no text), `radius-sm`'s documented fully-rounded pill exception,
 * `space-1` internal padding.
 *
 * Deliberately NOT the same thing as the future "Momentum / Heat" chip
 * (spec §7, §23 — rising/active/slowing/dormant, computed from star growth
 * etc., issue #21/ADR-004). This field is a hand-authored editorial
 * classification, not a computed signal, so it intentionally uses the
 * generic `success`/`warning` semantic tokens rather than the `momentum-*`
 * tokens reserved for that other feature.
 *
 * Icon shape: a plain, unrounded square swatch, not a circular dot —
 * MomentumChip's rising/active/slowing/dormant states are spec-locked to
 * the product's own 🔥/🟢/🟡/⚪ emoji (DESIGN-SYSTEM.md's Open questions:
 * "the one place emoji-as-icon is already spec'd and stays as-is"), so once
 * both chips render side-by-side on `/repo/[slug]` (issue #52 — a repo can
 * read `status: active` while its momentum reads `dormant`, and the two
 * chips used to render the *identical* green dot + "Active" text for the
 * common case), the shape had to differ here instead. Deliberately
 * `rounded-none`, not `radius-sm` (4px): a first pass tried 4px rounding on
 * this swatch's small 10px box, but a corner radius that large relative to
 * the box reads as a circle at a glance (measured with a real render before
 * merge, not just eyeballed in code) — the fix would have shipped without
 * actually solving the collision. A hard-edged square at 12px is
 * unambiguously not the emoji dot next to it, and needs no new emoji. See
 * docs/design/findings/UX-2026-003-status-momentum-chip-icon-collision.md.
 */
const STATUS_CONFIG: Record<RepoStatus, { label: string; textClassName: string }> = {
  active: { label: "Active", textClassName: "text-success-text" },
  maintained: { label: "Maintained", textClassName: "text-warning-text" },
  inactive: { label: "Inactive", textClassName: "text-text-secondary" },
};

export default function StatusChip({ status }: { status: RepoStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-subtle p-2 text-sm font-medium leading-none ${config.textClassName}`}
    >
      {/* Icon is decorative — the text label is what a screen reader
          announces; color/icon alone is never the only signal (WCAG 1.4.1).
          `bg-current` ties the swatch to this span's own text color, no
          separate color prop needed. `rounded-none` — a hard-edged square,
          not a circle — see the doc comment above for why 4px rounding
          didn't survive contact with a real render. */}
      <span aria-hidden="true" data-testid="status-chip-swatch" className="h-3 w-3 rounded-none bg-current" />
      {config.label}
    </span>
  );
}
