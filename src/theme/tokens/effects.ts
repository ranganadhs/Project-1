import { space } from './space';

/**
 * Backdrop blur intensities, for expo-blur / expo-glass-effect.
 *
 * Values are BlurView `intensity` (0–100). Named by the job the blur does,
 * because "how blurred" is meaningless without knowing what has to stay
 * readable through it.
 */
export const blur = {
  /** Barely there — a hairline separation under a sticky header. */
  subtle: 20,
  /** Standard chrome: nav bars, tab bars, toolbars. */
  chrome: 50,
  /** Content must NOT be readable through it — sheets, dialogs. */
  heavy: 80,
  /** Fully obscuring, for sensitive content in the app switcher. */
  obscure: 100,
} as const;

/**
 * Focus indicators.
 *
 * WCAG 2.2 requires a visible focus indicator with 3:1 contrast against
 * adjacent colours. The OFFSET matters as much as the width: a ring drawn
 * flush against a filled control is indistinguishable from a border, so it
 * sits outside the control's own edge.
 */
export const focus = {
  width: 2,
  /** Gap between the control's edge and the ring. */
  offset: 2,
  /** Corner rounding is inherited from the control; this is the fallback. */
  radius: 8,
} as const;

/**
 * Gradient stop positions and angles. The COLOURS come from the theme, since
 * they must flip with light/dark; only the geometry is a tier 1 constant.
 */
export const gradient = {
  /** Top-left → bottom-right. The standard brand wash. */
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  /** Straight down — for scrims over imagery. */
  vertical: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
  /** Stops for a scrim that fades content out under a caption. */
  scrimStops: [0, 0.4, 1] as const,
} as const;

/**
 * Aspect ratios as numbers, ready for the `aspectRatio` style prop.
 * Named by use, not by maths — nobody remembers what 1.7778 was for.
 */
export const aspectRatio = {
  square: 1,
  portrait: 3 / 4,
  landscape: 4 / 3,
  video: 16 / 9,
  ultrawide: 21 / 9,
  /** Tall product/story cards. */
  story: 9 / 16,
  /** Wide banner strips. */
  banner: 3 / 1,
} as const;

/**
 * Stroke weights for icon sets that support it, and for drawn rules.
 * Separate from `border` because an icon stroke scales with the icon, whereas
 * a border is a fixed hairline regardless of what it surrounds.
 */
export const stroke = {
  thin: 1,
  regular: 1.5,
  medium: 2,
  bold: 2.5,
} as const;

/**
 * Press-target expansions for controls smaller than size.touchTarget.
 * Re-exported through the barrel; kept beside the other geometry effects.
 */
export const hitSlop = {
  sm: { top: space[1], bottom: space[1], left: space[1], right: space[1] },
  md: { top: space[2], bottom: space[2], left: space[2], right: space[2] },
  lg: { top: space[3], bottom: space[3], left: space[3], right: space[3] },
} as const;
