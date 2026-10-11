import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * A thin determinate bar whose fill carries a STATUS tone — attendance against
 * the 75% bar is exactly the kind of verdict status colours are reserved for.
 * An optional `marker` draws the threshold tick, so "how far from 75%" reads
 * without a number.
 */
export function Meter({ value, tone, marker }: { value: number; tone: Tone; marker?: number }) {
  styles.useVariants({ tone });
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ now: Math.round(clamped * 100), min: 0, max: 100 }}>
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
      {marker !== undefined ? <View style={[styles.marker, { left: `${marker * 100}%` }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    height: theme.size.track.md,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.bg.sunken,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.full,
    variants: {
      tone: {
        success: { backgroundColor: theme.color.status.success.solid },
        warning: { backgroundColor: theme.color.status.warning.solid },
        danger: { backgroundColor: theme.color.status.danger.solid },
        info: { backgroundColor: theme.color.status.info.solid },
        neutral: { backgroundColor: theme.color.status.neutral.solid },
      },
    },
  },
  marker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: theme.border.thick,
    backgroundColor: theme.color.fg.tertiary,
  },
}));
