import { space } from './space';

/**
 * Layout tokens are NOT the spacing scale.
 *
 * `space` answers "how far apart are these two things". Layout answers "how is
 * a page built" — and those drift apart the moment someone picks `space[5]` for
 * a screen's side padding on one screen and `space[4]` on the next. Naming the
 * page gutter once is what makes every screen line up.
 */
export const layout = {
  /** Horizontal padding from the screen edge. The single most-reused value. */
  gutter: space[4],
  /** Wider gutter for spacious or marketing-style screens. */
  gutterWide: space[6],

  /** Vertical rhythm. */
  screenTop: space[4],
  screenBottom: space[6],
  /** Gap between major sections of a screen. */
  section: space[6],
  /** Gap between related blocks inside a section. */
  block: space[4],
  /** Gap between rows of a list that are not flush. */
  listGap: space[2],

  /**
   * Maximum text measure, in points. Long lines are hard to track back to the
   * start of the next one; this caps body copy on tablets and landscape.
   */
  measure: 640,
  /** Maximum width of centred content on large screens. */
  contentMaxWidth: 720,
  /** Maximum width of a form column. */
  formMaxWidth: 480,

  /** Height reserved for a floating bar so scroll content can clear it. */
  floatingBarClearance: space[20],
} as const;

/**
 * Responsive thresholds, in points. Lives here rather than in the Unistyles
 * config so breakpoints are a TOKEN — referenceable from layout maths, not just
 * from style media queries.
 *
 * `xs` must be 0: Unistyles requires a zero-width base breakpoint.
 */
export const breakpoint = {
  xs: 0,
  sm: 380,
  md: 600,
  lg: 900,
  xl: 1200,
} as const;

export type BreakpointKey = keyof typeof breakpoint;
