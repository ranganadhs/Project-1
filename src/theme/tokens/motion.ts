/**
 * Motion tokens serve every animation engine in the app so they cannot drift:
 *   - react-native-reanimated CSS  → `cssEasing` / `duration` (state-driven transitions and loops)
 *   - react-native-reanimated      → `spring` / `springRatio` (gesture, scroll, measured layout)
 *   - react-native-ease            → `easeTransition` (declarative state transitions)
 *
 * THE ENGINE DECISION, in the order that matters:
 *   1. A change driven by STATE — pressed, selected, open, a colour flipping —
 *      is a Reanimated CSS transition (`transitionProperty` in the style) or an
 *      ease transition. Both run off the JS thread with no worklet. Pick one per
 *      component; never both.
 *   2. A loop, or motion that plays on mount without a state change, is a
 *      Reanimated CSS animation (`animationName` keyframes).
 *   3. Anything a finger drives, anything derived from scroll, and anything
 *      whose target is a MEASURED layout is a shared value + `useAnimatedStyle`.
 *      Reach for a shared value only when the value is continuous or
 *      interruptible: a press scale is a transition; a drag is a shared value.
 *   4. Screen to screen is the native stack's own animation. Never hand-roll it.
 */
export const duration = {
  /** Below ~80ms reads as instant; use for press-down feedback. */
  instant: 60,
  fast: 120,
  /** Press feedback (100–150ms) and toggles (150–200ms) live here. */
  press: 150,
  normal: 200,
  slow: 320,
  slower: 480,
  /**
   * Long content reveals ONLY. A screen transition is never this: the platform
   * owns that timing, and overriding it is the first thing that reads as
   * "not native".
   */
  slowest: 640,
  pulse: 1000,
  shimmer: 1200,
} as const;

export const easing = {
  standard: 'easeInOut',
  /** Entering: decelerate into place. */
  enter: 'easeOut',
  /** Leaving: accelerate away — the user has stopped caring about it. */
  exit: 'easeIn',
  linear: 'linear',
} as const;

/**
 * Cubic-bezier control points for Reanimated CSS transitions and animations.
 *
 * Reanimated rejects a raw `'cubic-bezier(...)'` STRING — spread these into
 * `cubicBezier(...)` from `react-native-reanimated` at the call site:
 *
 *   transitionTimingFunction: cubicBezier(...theme.motion.cssEasing.enter)
 *
 * Kept as plain tuples rather than pre-built easings so this file stays free of
 * any react-native import — the contrast script and the token tests load the
 * tokens in plain Node.
 *
 * Never `ease-in` on UI. Deceleration is what makes an element feel like it
 * arrived; acceleration is for things leaving.
 */
export const cssEasing = {
  /** Decelerate hard into place. The default for anything entering or settling. */
  enter: [0.23, 1, 0.32, 1],
  /** Symmetric, for a value moving between two resting states — a toggle, a colour. */
  standard: [0.45, 0, 0.55, 1],
  /** Leaving: accelerate away. */
  exit: [0.55, 0, 1, 0.45],
  /** A sheet or panel: long, soft deceleration. */
  sheet: [0.32, 0.72, 0, 1],
} as const;

/**
 * Reanimated spring configs, described by DAMPING RATIO rather than by feel:
 *
 *   ζ = damping / (2 × √(stiffness × mass))
 *
 *   ζ < 1  underdamped — overshoots and oscillates (bouncy)
 *   ζ = 1  critically damped — fastest settle with NO overshoot (snappy)
 *   ζ > 1  overdamped — no overshoot, but sluggish
 *
 * `mass` is stated explicitly on every config: it is part of the ratio, and
 * leaving it to the library default makes the numbers impossible to reason
 * about when someone later tunes stiffness.
 *
 * Default to `snappy`. Reach for `bouncy` only when the bounce is the point —
 * a celebratory pop, never a UI control changing state.
 *
 * This is the PHYSICS form. Reanimated 4 also takes a DURATION form
 * (`springRatio` below), and the two cannot be mixed in one config: pass
 * `mass/damping/stiffness` OR `duration/dampingRatio`, never keys from both.
 */
export const spring = {
  /** ζ = 1.00 — critical. Fast, decisive, and lands without a wobble. */
  snappy: { mass: 1, damping: 40, stiffness: 400, overshootClamping: true },
  /** ζ = 0.99 — critical but softer, for larger surfaces that need weight. */
  gentle: { mass: 1, damping: 32, stiffness: 260, overshootClamping: true },
  /** ζ = 1.06 — slightly overdamped, for heavy sheets that should feel weighty. */
  heavy: { mass: 1.2, damping: 46, stiffness: 320, overshootClamping: true },
  /** ζ = 0.42 — deliberate overshoot. Opt in; never a default. */
  bouncy: { mass: 1, damping: 12, stiffness: 200 },
} as const;

/**
 * The DURATION form of a Reanimated 4 spring: Apple's two designer parameters,
 * taken directly.
 *
 * `duration` is PERCEPTUAL — the time the motion visibly takes, not the time
 * the physics takes to fully rest (Reanimated runs the spring for about 1.5×
 * this). `dampingRatio: 1` is critical, no overshoot; below 1 overshoots by an
 * amount a designer can name.
 *
 * Pair with `velocity` when a gesture hands off, so the spring continues the
 * finger's motion instead of restarting from zero. Never combine with the
 * physics keys above.
 */
export const springRatio = {
  /** Something settling into place after a state change. */
  settle: { duration: 400, dampingRatio: 1 },
  /** A drag snapping to a resting point — a little give, no wobble. */
  snap: { duration: 400, dampingRatio: 0.8 },
  /** A sheet presenting or dismissing. */
  sheet: { duration: 300, dampingRatio: 0.8 },
} as const;

/** EaseView transition presets. Timing-based so motion settles without wobble. */
export const easeTransition = {
  enter: { type: 'timing', duration: duration.slow, easing: easing.enter },
  exit: { type: 'timing', duration: duration.normal, easing: easing.exit },
  pop: { type: 'timing', duration: 260, easing: easing.enter },
  none: { type: 'none' },
} as const;

/** Press feedback scale factors. */
export const pressScale = {
  /** Rows and large cards — a big surface moving far reads as broken. */
  subtle: 0.98,
  standard: 0.96,
  /** Small standalone targets, where the travel needs to be visible. */
  strong: 0.94,
} as const;

/**
 * Delay before an animation begins.
 *
 * `stagger` is the per-item increment for a list that animates in sequence.
 * Keep it small — at 50ms the tenth row is already half a second late, which
 * is why long lists should stagger only the first few visible items.
 */
export const delay = {
  none: 0,
  short: 40,
  medium: 80,
  long: 160,
  stagger: 40,
} as const;
