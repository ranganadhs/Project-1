import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type StepProgressProps = {
  /** Number of segments. */
  steps: number;
  /** Segments filled, 0…steps. */
  done: number;
  /** `success` marks a finished pipeline, `warning` one waiting on the user (payment); otherwise brand. */
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  accessibilityLabel?: string;
};

/**
 * Segmented progress — "stage 2 of 5", "2 of 6 rated". Discrete segments rather
 * than a continuous bar because the thing being counted is discrete: a
 * half-filled bar implies a half-finished step that does not exist.
 */
export function StepProgress({ steps, done, tone = 'brand', accessibilityLabel }: StepProgressProps) {
  const count = Math.max(1, Math.round(steps));
  const filled = Math.min(count, Math.max(0, Math.round(done)));
  styles.useVariants({ tone });
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: count, now: filled }}
    >
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={i < filled ? styles.on : styles.off} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.space[1.5] },
  on: {
    flex: 1,
    height: theme.size.track.sm,
    borderRadius: theme.radius.full,
    variants: {
      tone: {
        brand: { backgroundColor: theme.color.interactive.primary.rest },
        success: { backgroundColor: theme.color.status.success.solid },
        warning: { backgroundColor: theme.color.status.warning.solid },
        danger: { backgroundColor: theme.color.status.danger.solid },
      },
    },
  },
  off: {
    flex: 1,
    height: theme.size.track.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.bg.sunken,
  },
}));
