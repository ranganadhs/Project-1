export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  /** Pill. Any value far larger than the element's height works. */
  full: 9999,
} as const;

export type RadiusKey = keyof typeof radius;

/**
 * Radius for a shape nested inside another rounded shape.
 *
 * Concentric corners only look right when the inner radius is the outer radius
 * minus the gap between them. Reusing the parent's radius on a child makes the
 * curves non-concentric and the inner shape looks subtly wrong — most visible
 * on an avatar or image inset within a card.
 */
export function nestedRadius(outer: number, inset: number): number {
  return Math.max(0, outer - inset);
}
