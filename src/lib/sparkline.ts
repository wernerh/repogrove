/**
 * SVG `points` for a `<polyline>` sparkline, oldest-first, scaled to fill a
 * `width` x `height` viewBox with `padding` on every side.
 *
 * Extracted from `StarGrowthChart` once the Grove page's repo rows became a
 * second caller (this codebase's "extract on second use" convention — see
 * `src/lib/format.ts`). Flat history (every value equal) renders a flat line
 * across the vertical middle rather than dividing by zero: `span` falls back
 * to `1` to avoid the division, but every point's fraction would then be
 * `0/1`, pinning the line to the bottom edge, so the flat case is handled
 * explicitly.
 */
export function buildSparklinePoints(
  values: number[],
  width: number,
  height: number,
  padding: number,
): string {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const isFlat = max === min;
  const span = max - min || 1;
  const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

  return values
    .map((value, i) => {
      const x = padding + i * stepX;
      const y = isFlat
        ? height / 2
        : height - padding - ((value - min) / span) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
