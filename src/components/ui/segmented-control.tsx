import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { haptics } from '@/lib/haptics';
import { Text } from './text';

export type SegmentedControlProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
};

/**
 * The track's padding, as a `space` KEY, so the stylesheet and the pill's
 * arithmetic cannot drift apart.
 *
 * They are two different mechanisms reading one value: the track's inset comes
 * from `StyleSheet.create`, while the pill is absolutely positioned and has its
 * width computed in JS. Written as separate literals they agree only until
 * someone restyles the track — and then every segment is a few points too wide.
 * That error is invisible on the first segment and accumulates, so the only
 * place it shows is the LAST one, whose right edge lands on the track's outer
 * edge with no padding while every other side keeps its inset.
 *
 * Exported for `segmented-control.test.tsx`, which asserts both halves.
 */
export const TRACK_INSET = 0.5;

/**
 * Width of one segment, given the measured track and the inset it is padded by.
 *
 * Divides the PADDED width — dividing the full width overflows the track by
 * exactly `2 * inset`. Returns 0 before the track has been measured, which is
 * what keeps the pill from flashing at x=0 on first paint.
 */
export function segmentWidthFor(trackWidth: number, count: number, inset: number): number {
  if (trackWidth <= 0) return 0;
  return (trackWidth - inset * 2) / Math.max(count, 1);
}

/**
 * Single-select control with a sliding selection pill.
 *
 * The pill is one absolutely-positioned view that springs to the selected
 * segment, rather than a background toggled per segment. That distinction is
 * what makes it read as a single object moving instead of two things blinking
 * — and it means the motion is interruptible: tapping mid-flight redirects the
 * pill from wherever it currently is.
 *
 * Reanimated shared values rather than a CSS transition or react-native-ease
 * because the pill's target is derived from a MEASURED layout, so it must
 * animate on the UI thread from a value that changes with the container width.
 *
 * The selection haptic fires on the PRESS, not when the pill lands: the
 * feedback belongs to the user's action, and a haptic that arrives when the
 * spring settles is late enough to read as a second, unrelated event.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { theme } = useUnistyles();
  const [trackWidth, setTrackWidth] = useState(0);

  const count = Math.max(options.length, 1);
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );

  // Both the inset and the stylesheet below read TRACK_INSET, so a restyle
  // moves them together. See the note on the constant.
  const inset = theme.space[TRACK_INSET];
  const segmentWidth = segmentWidthFor(trackWidth, count, inset);

  const translateX = useDerivedValue(
    () => withSpring(selectedIndex * segmentWidth, theme.motion.spring.snappy),
    [selectedIndex, segmentWidth],
  );

  const pillStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: translateX.get() }],
  }));

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      style={styles.track}
      onLayout={onTrackLayout}
      accessibilityRole="tablist"
      testID="segmented-control"
    >
      {/*
        Rendered before the segments so it sits behind the labels. Hidden until
        the track has been measured, so it never flashes at x=0 on first paint.
      */}
      {segmentWidth > 0 ? <Animated.View style={[styles.pill, pillStyle]} /> : null}

      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) haptics.select();
              onChange(option.value);
            }}
            style={styles.segment}
          >
            <Text
              variant="label"
              weight={selected ? 'semibold' : 'regular'}
              tone={selected ? 'primary' : 'secondary'}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    flexDirection: 'row',
    padding: theme.space[TRACK_INSET],
    ...theme.shape.field,
    backgroundColor: theme.color.bg.sunken,
  },
  pill: {
    position: 'absolute',
    top: theme.space[TRACK_INSET],
    bottom: theme.space[TRACK_INSET],
    left: theme.space[TRACK_INSET],
    // Concentric with the track rather than guessed: the pill is inset on every
    // side, so its corner has to be the track's corner MINUS that inset, or the
    // two curves visibly disagree at the ends. `nestedRadius` is the tier 1
    // helper for exactly this, and the curve still has to be asked for.
    //
    // `radius.lg` is the step `shape.field` is built from — the track above
    // reads the ROLE, this reads the step it resolves to, because arithmetic
    // needs a number. Change `field` in shape.ts and change this with it.
    ...theme.shape.smooth,
    borderRadius: theme.nestedRadius(theme.radius.lg, theme.space[TRACK_INSET]),
    backgroundColor: theme.color.bg.raised,
    ...theme.elevation.sm,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // md (44pt), not sm (32pt): a segment is the tap target, and sm is under
    // the touch floor. `size.touchTarget` is a floor, never a suggestion.
    minHeight: theme.size.control.md,
  },
}));
