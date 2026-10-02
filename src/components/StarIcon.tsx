/**
 * Star mark in the tertiary amber (`--color-accent-star`). Decorative: the
 * adjacent star count carries the information, so the icon is `aria-hidden`
 * (replaces the ⭐ emoji, which rendered with platform-dependent colors and
 * ignored the dark-mode palette).
 */
export default function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="currentColor"
      className={`text-accent-star ${className}`}
    >
      <path d="M8 .9l2.06 4.5 4.9.55-3.66 3.3 1.02 4.83L8 11.6l-4.32 2.48 1.02-4.83L1.04 5.95l4.9-.55L8 .9z" />
    </svg>
  );
}
