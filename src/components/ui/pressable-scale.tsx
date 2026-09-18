import { useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
  /** Defaults to the subtle press scale from motion tokens. */
  pressedScale?: number;
};

/**
 * A Pressable that eases down on press — the standard tactile feedback.
 * Driven entirely by motion tokens, so press feel is tuned in one place.
 *
 * ── A CSS TRANSITION, NOT A SHARED VALUE ──────────────────────────────────
 * Press is a two-state toggle: pressed or not. Reanimated's CSS transition
 * animates the `transform` whenever its value changes between renders, runs
 * in Reanimated's core off the JS thread, and needs no worklet, no
 * `useAnimatedStyle`, and no shared value to keep in sync. A shared value is
 * for a CONTINUOUS or interruptible input — a drag, a scroll — and using one
 * for a toggle is the mobile equivalent of installing a motion library for a
 * fade. The state update is one render per press edge, which is the cost the
 * transition model asks for and the reason it can be this simple.
 *
 * `hitSlop` defaults to the small token so a control drawn under the 44pt
 * floor still has a 44pt target; `pressRetentionOffset` gives the finger room
 * to drift before the press cancels. Both are overridable per call site.
 */
export function PressableScale({
  style,
  pressedScale,
  onPressIn,
  onPressOut,
  hitSlop,
  pressRetentionOffset,
  children,
  ...rest
}: PressableScaleProps) {
  const { theme } = useUnistyles();
  const target = pressedScale ?? theme.motion.pressScale.subtle;
  const [pressed, setPressed] = useState(false);

  return (
    <AnimatedPressable
      style={[
        style,
        {
          transform: [{ scale: pressed ? target : 1 }],
          transitionProperty: 'transform',
          transitionDuration: theme.motion.duration.press,
          transitionTimingFunction: cubicBezier(...theme.motion.cssEasing.enter),
        },
      ]}
      hitSlop={hitSlop ?? theme.hitSlop.sm}
      pressRetentionOffset={pressRetentionOffset ?? theme.hitSlop.md}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
