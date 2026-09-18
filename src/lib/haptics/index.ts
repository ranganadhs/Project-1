import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptics, named by MEANING rather than by waveform.
 *
 * `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` describes a vibration.
 * `haptics.select()` describes an intent — which is the thing that should stay
 * stable when you later decide selections should feel lighter.
 *
 * Two rules that separate good haptics from annoying ones:
 *
 *   1. Haptics CONFIRM, they do not announce. Fire on the result of an action,
 *      never on every tap. A buzz on each keystroke is the fastest way to make
 *      a user disable feedback system-wide.
 *   2. Never make haptics load-bearing. They are silent on many Android
 *      devices, off entirely when the user disables them, and absent on web.
 *      Anything conveyed only by vibration is not conveyed.
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

export const haptics = {
  /** Moving through options — a segmented control, a picker, a slider detent. */
  select: () => safe(() => Haptics.selectionAsync()),

  /** A light confirmation — a toggle flipping, a chip selecting. */
  light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  /** A standard confirmation — a primary button committing an action. */
  medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  /** A weighty confirmation — a destructive action, a drag snapping home. */
  heavy: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),

  /** An operation completed. Pair with a visual confirmation, never alone. */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),

  /** Something needs attention but is not a failure. */
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),

  /** An operation failed. Pair with a visible error message. */
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
} as const;
