import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/components/ui/text';
import type { Tone } from './meter';

/**
 * A progress ring with the figure in the middle. SVG rather than a rotated-half
 * trick so the arc is exact at any value and the stroke caps are round.
 * Colours are passed as SVG props, so they come from `useUnistyles` — the ring
 * sits inside a Unistyles-painted card, which hides the one-render lag (trap 12).
 */
export function Ring({
  value,
  tone,
  size = 132,
  label,
  caption,
}: {
  value: number;
  tone: Tone;
  size?: number;
  label: string;
  caption?: string;
}) {
  const { theme } = useUnistyles();
  const stroke = Math.round(size * 0.09);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, value));
  const color = theme.color.status[tone].solid;

  return (
    <View style={[styles.wrap, { width: size, height: size }]} accessibilityRole="image" accessibilityLabel={`${label}${caption ? ` ${caption}` : ''}`}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.color.bg.sunken} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - clamped)}
          // Start at 12 o'clock.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text variant="display">
        {label}
      </Text>
      {caption ? (
        <Text variant="caption" tone="secondary">
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
}));
