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
 * etc., issue #21/ADR-004, not yet built). This field is a hand-authored
 * editorial classification, not a computed signal, so it intentionally uses
 * the generic `success`/`warning` semantic tokens rather than the
 * `momentum-*` tokens reserved for that future feature — see
 * DESIGN-SYSTEM.md's "Open questions" for the icon-collision note (both use
 * 🟢/🟡/⚪) this lane flagged for whoever builds momentum chips next to a
 * status chip on the same repo page.
 */
const STATUS_CONFIG: Record<RepoStatus, { icon: string; label: string; textClassName: string }> = {
  active: { icon: "🟢", label: "Active", textClassName: "text-success-text" },
  maintained: { icon: "🟡", label: "Maintained", textClassName: "text-warning-text" },
  inactive: { icon: "⚪", label: "Inactive", textClassName: "text-text-secondary" },
};

export default function StatusChip({ status }: { status: RepoStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-subtle p-2 text-sm font-medium leading-none ${config.textClassName}`}
    >
      {/* Icon is decorative — the text label is what a screen reader
          announces; color/icon alone is never the only signal (WCAG 1.4.1). */}
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}
