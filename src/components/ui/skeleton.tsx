import { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: 'sm' | 'md' | 'lg' | 'full';
};

/**
 * Loading placeholder with a pulsing wash.
 *
 * Reanimated rather than react-native-ease: this is a continuously repeating
 * animation, not a transition between two declarative states.
 *
 * Nothing here checks Reduce Motion, and nothing needs to: every Reanimated
 * animation defaults to `ReduceMotion.System`, so under the OS setting
 * `withRepeat` plays its first iteration and rests. The wash stays at a fixed
 * opacity instead of pulsing, which is the right degradation for a placeholder.
 */
export function Skeleton({ width = '100%', height, radius = 'md' }: SkeletonProps) {
  const { theme } = useUnistyles();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withRepeat(
        withTiming(1, {
          duration: theme.motion.duration.shimmer,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );
  }, [progress, theme.motion.duration.shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + progress.get() * 0.4,
  }));

  styles.useVariants({ radius });

  return (
    <View style={[styles.container, { width, height: height ?? theme.space[4] }]}>
      <Animated.View style={[styles.fill, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    overflow: 'hidden',
    // The radius arrives as a prop, so there is no role to read. The variants
    // below still set the value; this sets how the curve is drawn.
    ...theme.shape.smooth,
    variants: {
      radius: {
        sm: { borderRadius: theme.radius.sm },
        md: { borderRadius: theme.radius.md },
        lg: { borderRadius: theme.radius.lg },
        full: { borderRadius: theme.radius.full },
      },
    },
  },
  fill: {
    flex: 1,
    backgroundColor: theme.color.bg.sunken,
  },
}));
