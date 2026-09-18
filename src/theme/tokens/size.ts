/** Control geometry. `touchTarget` is the accessibility floor — never go below it. */
export const size = {
  /** WCAG 2.2 target size minimum. Any interactive element must reach this. */
  touchTarget: 44,

  /** Height of pressable controls. */
  control: { xs: 24, sm: 32, md: 44, lg: 52, xl: 60 },

  icon: { '2xs': 10, xs: 12, sm: 16, md: 20, lg: 24, xl: 32, '2xl': 40 },

  avatar: { '2xs': 16, xs: 20, sm: 28, md: 36, lg: 48, xl: 64, '2xl': 96 },

  /** Small circular status dots and unread markers. */
  dot: { sm: 6, md: 8, lg: 10 },

  /** Badge/pill heights. */
  badge: { sm: 16, md: 20, lg: 24 },

  /** Thickness of progress bars, sliders, and scrubbers. */
  track: { thin: 2, sm: 4, md: 8, lg: 12 },

  /** The grabber on a bottom sheet, and drag handles generally. */
  handle: { width: 36, height: 5 },

  /** Chrome heights, for reserving scroll clearance. */
  bar: { tab: 49, header: 44, toolbar: 44 },

  /**
   * Chart canvas heights.
   *
   * A Skia canvas has NO intrinsic size and collapses to zero without an
   * explicit one — the same failure mode as an @expo/ui Host. It is a design
   * value rather than data, which is why it is tokenised while the marks
   * inside are computed.
   */
  chart: { height: 180 },
} as const;
