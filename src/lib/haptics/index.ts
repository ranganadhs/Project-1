import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptics, named by MEANING rather than by waveform.
 *
 * `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` describes a vibration.
 * `haptics.select()` describes an intent — which is the thing that should stay
 * stable when you later decide selections should feel lighter.
 *
 * ── THERE ARE TWO CLASSES OF HAPTIC AND THEY ANSWER DIFFERENT QUESTIONS ────
 *
 *   PRESS   fires when the finger LANDS, and answers "the control took your
 *           touch". It is the control's physicality — the same job
 *           `PressableScale`'s spring already does visually. Impact and
 *           selection generators.
 *
 *   RESULT  fires when the operation RETURNS, and answers "the thing you asked
 *           for happened". Notification generators.
 *
 * This module used to carry one rule — "fire on the result of an action, never
 * on every tap" — and that rule is right about the second class and wrong to
 * extend to the first. What it is protecting against is a NOTIFICATION haptic
 * per tap, which is genuinely how a user ends up disabling feedback system-wide.
 * A press transient is not an announcement. Read strictly, the old wording is
 * why the app shipped with three haptic calls in it and silent buttons.
 *
 * So: press feedback on every control, notification feedback only on results,
 * and the two never fire for the same event. Stopping a recording is a press
 * (`rigid`); the upload landing is a result (`success`).
 *
 * ── THE RULE THAT DID NOT CHANGE ──────────────────────────────────────────
 * Never make haptics load-bearing. They are silent on many Android devices, off
 * entirely when the user disables them, and absent on web. Anything conveyed
 * only by vibration is not conveyed — which is why the ten-second warning below
 * is paired with the ring turning red rather than standing alone.
 *
 * ── ANDROID DOES NOT USE THE VIBRATOR PATH ────────────────────────────────
 * `impactAsync` and `notificationAsync` are simulated on Android with the
 * `Vibrator` API, which expo-haptics' own documentation says is "not
 * recommended for implementing haptics feedback" and which is what drags
 * `VIBRATE` into the merged manifest.
 *
 * `performAndroidHapticsAsync` calls `View.performHapticFeedback` instead: no
 * permission, and the platform's OWN named effects rather than a guessed
 * vibration length. Android gets `Toggle_On`/`Toggle_Off` for a switch,
 * `Segment_Tick` for a segmented control, `Confirm`/`Reject` for results —
 * each of which the OEM has tuned for that exact meaning. Mapping every call
 * to a duration would throw all of that away.
 *
 * Every call is fire-and-forget and swallows errors: a device without a taptic
 * engine rejects the promise, and an unhandled rejection is a worse bug than a
 * missing buzz.
 */
const safe = (run: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  void run().catch(() => {
    // No taptic engine, or the user disabled feedback. Not an error.
  });
};

/**
 * One haptic, expressed for both platforms.
 *
 * `ios` is a thunk rather than a pre-built promise so nothing fires at module
 * load — these are declared at the top level of a module every screen imports.
 */
const feedback = (ios: () => Promise<void>, android: Haptics.AndroidHaptics) => () =>
  safe(() =>
    Platform.OS === 'android' ? Haptics.performAndroidHapticsAsync(android) : ios(),
  );

const impact = (style: Haptics.ImpactFeedbackStyle) => () => Haptics.impactAsync(style);
const notify = (type: Haptics.NotificationFeedbackType) => () => Haptics.notificationAsync(type);

export const haptics = {
  /**
   * The lightest tick there is — a list row, a header icon, a scrim dismiss.
   *
   * These are the controls a user hits most often and least deliberately, so
   * they get the transient with the least energy in it. `Segment_Frequent_Tick`
   * on Android is documented as "expected to be very soft, so as not to be
   * uncomfortable when performed a lot in quick succession", which is exactly
   * the case being described.
   */
  soft: feedback(
    impact(Haptics.ImpactFeedbackStyle.Soft),
    Haptics.AndroidHaptics.Segment_Frequent_Tick,
  ),

  /** A secondary control taking a press — a soft or outline button, a tile. */
  light: feedback(impact(Haptics.ImpactFeedbackStyle.Light), Haptics.AndroidHaptics.Virtual_Key),

  /** A primary committing — the solid button that is the point of the screen. */
  medium: feedback(impact(Haptics.ImpactFeedbackStyle.Medium), Haptics.AndroidHaptics.Confirm),

  /** A weighty press — a destructive action, or one that cannot be undone. */
  heavy: feedback(impact(Haptics.ImpactFeedbackStyle.Heavy), Haptics.AndroidHaptics.Long_Press),

  /**
   * A hard, precise stop — a recording starting or letting go, a shutter.
   *
   * `Rigid` rather than `Heavy`: the difference is compression, not force. A
   * heavy transient reads as MASS ("that was a big thing"); a rigid one reads
   * as PRECISION ("that landed exactly there"), which is what the edge of a
   * recording is. Android has no rigid analogue, so it takes the gesture
   * boundary effect, which is the same idea expressed in its own vocabulary.
   */
  rigid: feedback(
    impact(Haptics.ImpactFeedbackStyle.Rigid),
    Haptics.AndroidHaptics.Gesture_End,
  ),

  /** Moving through options — a segmented control, a picker, a radio row. */
  select: feedback(() => Haptics.selectionAsync(), Haptics.AndroidHaptics.Segment_Tick),

  /**
   * A switch flipping. Directional, because Android draws a distinction the
   * iOS generators do not: `Toggle_On` and `Toggle_Off` are separate effects,
   * and a switch that feels identical in both directions is throwing away a
   * signal the platform is offering for free.
   */
  toggle: (on: boolean) =>
    feedback(
      impact(on ? Haptics.ImpactFeedbackStyle.Rigid : Haptics.ImpactFeedbackStyle.Soft),
      on ? Haptics.AndroidHaptics.Toggle_On : Haptics.AndroidHaptics.Toggle_Off,
    )(),

  /** An operation completed. Pair with a visual confirmation, never alone. */
  success: feedback(
    notify(Haptics.NotificationFeedbackType.Success),
    Haptics.AndroidHaptics.Confirm,
  ),

  /** Something needs attention but is not a failure. */
  warning: feedback(
    notify(Haptics.NotificationFeedbackType.Warning),
    Haptics.AndroidHaptics.Clock_Tick,
  ),

  /** An operation failed. Pair with a visible error message. */
  error: feedback(notify(Haptics.NotificationFeedbackType.Error), Haptics.AndroidHaptics.Reject),
} as const;

/**
 * How hard a control feels when the finger lands on it.
 *
 * A component names a WEIGHT and never a waveform, for the same reason a
 * component reads `theme.shape.card` and never a radius: the mapping is a
 * design decision that should be made once. `'none'` is representable so a
 * control can opt out without the call site branching on a boolean.
 */
export type PressWeight = 'soft' | 'light' | 'medium' | 'heavy' | 'rigid' | 'select' | 'none';

const PRESS: Record<Exclude<PressWeight, 'none'>, () => void> = {
  soft: haptics.soft,
  light: haptics.light,
  medium: haptics.medium,
  heavy: haptics.heavy,
  rigid: haptics.rigid,
  select: haptics.select,
};

/**
 * Fire the press transient for a weight. Safe to call with `'none'`, which is
 * the point — the branch lives here rather than at every press handler.
 */
export function pressHaptic(weight: PressWeight = 'light'): void {
  if (weight === 'none') return;
  PRESS[weight]();
}
