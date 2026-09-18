const BASE = 4;

/**
 * Spacing scale — the distance BETWEEN two things.
 *
 * Not to be confused with `layout` (tokens/layout.ts), which describes how a
 * PAGE is built: gutters, section rhythm, max widths. Reaching for `space[4]`
 * as a screen's side padding is what makes one screen sit 16pt from the edge
 * and the next 20pt; `layout.gutter` is the token for that job.
 *
 * Rough guide to the ranges:
 *   0–1.5   hairline separation inside a control (icon to its label)
 *   2–3     related elements in a group (label to input)
 *   4–6     distinct elements in a section (card to card)
 *   8–12    separation between sections
 *   16+     large empty areas, hero spacing, empty states
 *
 * Half-steps exist for optical correction only — when a 4pt step looks wrong
 * because of a glyph's side bearing or an icon's internal padding. If you are
 * reaching for one to make a layout "fit", the layout is the problem.
 */
export const space = {
  0: 0,
  0.5: BASE * 0.5,
  1: BASE,
  1.5: BASE * 1.5,
  2: BASE * 2,
  2.5: BASE * 2.5,
  3: BASE * 3,
  4: BASE * 4,
  5: BASE * 5,
  6: BASE * 6,
  7: BASE * 7,
  8: BASE * 8,
  10: BASE * 10,
  12: BASE * 12,
  14: BASE * 14,
  16: BASE * 16,
  20: BASE * 20,
  24: BASE * 24,
  32: BASE * 32,
} as const;

export type SpaceKey = keyof typeof space;
