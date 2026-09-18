import { useEffect, useState } from 'react';
import { AccessibilityInfo, type StyleProp, type ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

export type LottieProps = {
  /** A `require`d composition from `@/lib/assets` — see the note there on literal paths. */
  source: unknown;
  autoPlay?: boolean;
  loop?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Lottie composition.
 *
 * ── COLOURS DO NOT FOLLOW THE THEME ───────────────────────────────────────
 * Every colour in a Lottie file is baked into its JSON, so a composition will
 * NOT flip between light and dark the way a token-driven component does — the
 * same class of trap as `@expo/ui` views ignoring your tokens. Either commission
 * artwork that reads on both schemes, or retint named layers with
 * `colorFilters`. Do not ship a second JSON per theme; that is two assets to
 * keep in step forever, and they will drift.
 *
 * ── REDUCE MOTION ─────────────────────────────────────────────────────────
 * A looping animation is exactly what that setting exists to stop, and nobody
 * remembers to check it. This holds frame 0 instead of playing.
 *
 * It holds a frame rather than rendering nothing, so the artwork still occupies
 * its space and no layout shifts between the two settings — the usual mistake
 * is to drop the element and have every surrounding view move.
 *
 * The check is asynchronous, so the first frame always renders as "playing" and
 * the still frame arrives a commit later. That is fine for a decorative
 * animation and is why the test uses `waitFor`.
 *
 * ── NATIVE MODULE ─────────────────────────────────────────────────────────
 * Adding this package requires a rebuild (`npx expo run:ios`). A Metro reload
 * will not pick it up. On web, `lottie.web.tsx` takes over — see the note there.
 */
export function Lottie({ source, autoPlay = true, loop = true, style, testID }: LottieProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return (
    <LottieView
      source={source as never}
      autoPlay={autoPlay && !reduceMotion}
      loop={loop && !reduceMotion}
      progress={reduceMotion ? 0 : undefined}
      resizeMode="contain"
      style={style}
      testID={testID}
    />
  );
}
