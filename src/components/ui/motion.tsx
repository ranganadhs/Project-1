import { useEffect, useRef, useState, type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { EaseView } from 'react-native-ease';
import { useReducedMotion } from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';
import { Text, type TextProps } from './text';

/**
 * The app's entrance motion, as two primitives.
 *
 * ── WHY THESE EXIST AT ALL ────────────────────────────────────────────────
 * `tokens/motion.ts` designed a full entrance vocabulary — `easeTransition`,
 * `delay.stagger`, the ζ-documented springs — and until now NOTHING imported
 * it. Every screen swapped its skeleton for content as a hard cut, which is
 * the one moment the user is actually watching.
 *
 * The alternative to a shared primitive is 250-odd files each hand-rolling
 * their own fade. That is how an app ends up with four different entrance
 * durations on one screen, so entrance motion lives here and only here.
 *
 * ── WHY EASE AND NOT REANIMATED ───────────────────────────────────────────
 * The engine table in CLAUDE.md: a mount entrance is a DECLARATIVE STATE
 * TRANSITION with no continuous input, which is `react-native-ease`'s exact
 * job. It runs on Core Animation / ObjectAnimator with no JS loop, so a list
 * staggering twenty rows costs the JS thread nothing — where twenty Reanimated
 * mounts each allocate a shared value and a worklet.
 *
 * Reanimated stays for the gesture-, scroll- and layout-driven work it is
 * better at: `PressableScale`, `SegmentedControl`, `MicOrb`, `ScoreMeter`.
 */

/**
 * Beyond this many rows the stagger stops incrementing.
 *
 * `delay.stagger` is 40ms, so an uncapped list has its twentieth row arriving
 * 800ms after its first — long enough that a student scrolling immediately
 * watches content appear UNDER their thumb. The motion tokens call this out
 * ("long lists should stagger only the first few visible items"); this is the
 * number that enforces it.
 *
 * Six is roughly a phone's worth of cards. Everything past it enters with the
 * sixth, which is invisible because everything past it is below the fold.
 */
const STAGGER_CAP = 6;

/** How far a fading element travels up into place, in points. */
const RISE = 12;

export type FadeInProps = {
  children: ReactNode;
  /**
   * Layout style for the entering element.
   *
   * Pass the style of the wrapper this REPLACES rather than nesting inside it —
   * a gutter, an `alignSelf`, a margin. That is how an entrance costs no view
   * depth; see `home-screen.tsx`.
   *
   * ── `opacity` AND `transform` ARE STRIPPED FROM IT ────────────────────────
   * EaseView removes any style key that collides with a property it is
   * animating, and this always animates opacity and translateY. So an `opacity`
   * or `transform` in the style passed here is silently dropped — with a
   * `console.warn` in dev and nothing at all in release. If an element needs a
   * resting opacity or a static transform, put it on a child, not here.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Position in a list. Converts to a staggered delay, capped at `STAGGER_CAP`.
   *
   * Pass the map index directly — `items.map((item, i) => <FadeIn index={i}>`.
   * Ignored when `delay` is given.
   */
  index?: number;
  /** Explicit delay in ms, for sequencing that is not a list. Overrides `index`. */
  delay?: number;
  /**
   * Whether the element rises as it fades in. On by default.
   *
   * Turn it OFF for anything already in its final position that would read as
   * jumping — a full-bleed hero, or an element inside a container that is
   * itself rising, where the two translations compound.
   */
  rise?: boolean;
  /** Slower entrance for a large surface that needs weight. */
  emphasis?: 'normal' | 'slow';
};

/**
 * Fades its children in on mount, optionally rising into place.
 *
 * Mount is the trigger, so this animates when the subtree first renders — which
 * for a query-backed screen is the moment the skeleton is replaced by real
 * data. That is the transition it is for. It does NOT re-run on re-render, so a
 * refetch that returns the same shape will not re-fade the screen.
 *
 * There is no exit counterpart: EaseView is state-driven and cannot animate a
 * component that React has already unmounted. An element that must animate OUT
 * has to keep itself mounted and drive its own opacity — which is a per-case
 * decision, not something a wrapper can do for a caller.
 */
export function FadeIn({
  children,
  style,
  index,
  delay,
  rise = true,
  emphasis = 'normal',
}: FadeInProps) {
  const { theme } = useUnistyles();
  const reduceMotion = useReducedMotion();

  const staggered =
    delay ?? (index === undefined ? 0 : Math.min(index, STAGGER_CAP) * theme.motion.delay.stagger);

  // Rendered as an EaseView in BOTH branches rather than falling back to a
  // plain View. Swapping the component type under reduce-motion would change
  // the view tree — and on iOS a native view appearing where a flattened one
  // was is exactly the kind of difference that shifts a layout by a point.
  return (
    <EaseView
      style={style}
      initialAnimate={reduceMotion ? undefined : { opacity: 0, translateY: rise ? RISE : 0 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={
        reduceMotion
          ? { type: 'none' }
          : {
              type: 'timing',
              duration:
                emphasis === 'slow' ? theme.motion.duration.slower : theme.motion.duration.slow,
              easing: theme.motion.easing.enter,
              delay: staggered,
            }
      }
    >
      {children}
    </EaseView>
  );
}

export type CountUpProps = Omit<TextProps, 'children'> & {
  /** The value to land on. */
  value: number;
  /**
   * Where the count starts on FIRST mount. Defaults to 0.
   *
   * On a subsequent change the count always starts from what is currently on
   * screen, so a score moving 62 → 68 counts those six and does not drop to
   * zero and climb back.
   */
  from?: number;
  /** Digits after the decimal point. Whole numbers by default. */
  precision?: number;
};

/**
 * A number that counts to its value.
 *
 * ── ONLY FOR NUMBERS THAT MEAN SOMETHING ──────────────────────────────────
 * This is the "meaningful animation" case and it is easy to overuse. A score a
 * student earned counts up because the count IS the achievement being shown.
 * A row's timestamp, a count of unread items, a page number — none of those
 * earn it, and animating them makes the app feel slow rather than alive.
 *
 * Rule of thumb: if the number going UP is good news, count it. Otherwise
 * render it.
 *
 * ── WHY THIS IS THE ONE PLACE JS DRIVES AN ANIMATION ──────────────────────
 * Text CONTENT cannot be animated off the JS thread. Neither EaseView nor
 * Reanimated can interpolate the characters inside a `<Text>` — Reanimated's
 * usual answer is an animated `TextInput`, which would mean giving up the
 * `Text` primitive's variants, tones and Fredoka face for the sake of one
 * number.
 *
 * So this drives ~600ms of setState from rAF, deliberately, and is reserved
 * for the one or two hero numbers on a screen. Do not put it in a list row:
 * twenty of these ticking at once is twenty re-renders a frame.
 *
 * `numeric` is forced on, never passed — as a declaration that this value
 * changes in place, which is what the prop now means.
 *
 * IT DOES NOT STOP THE WIDTH MOVING, and nothing could. Fredoka ships no
 * `tnum` feature, so tabular figures are inert on it; and a count climbing
 * 0 → 42 gains a digit on the way, which no font can hold still. The number
 * therefore widens as it counts, and whatever sits beside it shifts for the
 * ~600ms the animation lasts. That is accepted: it was the alternative — every
 * numeral in the app leaving the brand face and losing its weight — that was
 * not. See `NUMERIC_STYLE` in `text.tsx` for the measurements.
 */
export function CountUp({ value, from = 0, precision = 0, ...textProps }: CountUpProps) {
  const { theme } = useUnistyles();
  const reduceMotion = useReducedMotion();

  const [display, setDisplay] = useState(() => (reduceMotion ? value : from));
  // What is CURRENTLY on screen, read at the start of each run so an
  // interrupted count resumes from where the eye last saw it rather than
  // snapping back to the previous target.
  const currentRef = useRef(display);
  const duration = theme.motion.duration.slower;

  // Reduce-motion has no animation to run, so the value is adopted DURING
  // RENDER rather than from an effect. React supports adjusting state in
  // render for exactly this — deriving from a changed prop — and it re-renders
  // before committing, so nothing is ever painted showing the stale number.
  //
  // An effect doing the same job is what `react-hooks/set-state-in-effect`
  // forbids, and rightly: it would paint `from` for a frame and then cascade a
  // second render to correct it. For a student who has asked the OS to reduce
  // motion, that flash of a wrong score is precisely the thing they turned off.
  if (reduceMotion && display !== value) {
    setDisplay(value);
  }

  useEffect(() => {
    if (reduceMotion) {
      // Keeps the resume point honest without touching state. If the student
      // turns reduce-motion back OFF, the next change must count from the
      // number currently on screen — not from whatever the last animation
      // happened to leave behind.
      currentRef.current = value;
      return;
    }

    const start = currentRef.current;
    if (start === value) return;

    let frame: number;
    const startedAt = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(1, elapsed / duration);
      // easeOutCubic — decelerates into the final value, matching
      // `easing.enter`. A linear count reads as a machine counting; this reads
      // as a value arriving.
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = start + (value - start) * eased;

      currentRef.current = next;
      setDisplay(next);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        // Land on the EXACT value. Interpolation gets arbitrarily close and
        // rounding a near-miss the wrong way would show 67 for a score of 68.
        currentRef.current = value;
        setDisplay(value);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduceMotion, duration]);

  return (
    <Text {...textProps} numeric>
      {display.toFixed(precision)}
    </Text>
  );
}
