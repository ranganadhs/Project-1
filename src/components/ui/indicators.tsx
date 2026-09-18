import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from './text';

export type StatusTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

/** Compact status pill. */
export function Badge({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  styles.useVariants({ tone });
  return (
    <View style={styles.badge}>
      <Text variant="caption" weight="semibold" style={styles.badgeLabel}>
        {label}
      </Text>
    </View>
  );
}

/** Selectable / removable tag. */
export function Chip({ label, selected = false }: { label: string; selected?: boolean }) {
  styles.useVariants({ selected });
  return (
    <View style={styles.chip}>
      <Text variant="label" tone={selected ? 'onBrand' : 'secondary'}>
        {label}
      </Text>
    </View>
  );
}

export function Spinner({ size = 'small' }: { size?: 'small' | 'large' }) {
  const { theme } = useUnistyles();
  return <ActivityIndicator size={size} color={theme.color.interactive.primary.rest} />;
}

/** Determinate progress, 0–1. */
export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <View style={styles.progressTrack} accessibilityRole="progressbar">
      <View style={[styles.progressFill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

/** Inline message. */
export function Banner({
  tone = 'info',
  title,
  message,
}: {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  message?: string;
}) {
  styles.useVariants({ bannerTone: tone });
  return (
    <View style={styles.banner}>
      <Text variant="label" weight="semibold" style={styles.bannerTitle}>
        {title}
      </Text>
      {message ? (
        <Text variant="label" tone="secondary">
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.space[2],
    paddingVertical: theme.space[0.5],
    ...theme.shape.chip,
    variants: {
      tone: {
        // status.neutral, not interactive.secondary: a badge is not
        // interactive, and borrowing a control's fill means it would shift
        // if button styling ever changed.
        neutral: { backgroundColor: theme.color.status.neutral.bg },
        brand: { backgroundColor: theme.color.interactive.primary.rest },
        success: { backgroundColor: theme.color.status.success.bg },
        warning: { backgroundColor: theme.color.status.warning.bg },
        danger: { backgroundColor: theme.color.status.danger.bg },
        info: { backgroundColor: theme.color.status.info.bg },
      },
    },
  },
  badgeLabel: {
    variants: {
      tone: {
        neutral: { color: theme.color.status.neutral.fg },
        brand: { color: theme.color.fg.onBrand },
        success: { color: theme.color.status.success.fg },
        warning: { color: theme.color.status.warning.fg },
        danger: { color: theme.color.status.danger.fg },
        info: { color: theme.color.status.info.fg },
      },
    },
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.space[3],
    paddingVertical: theme.space[1.5],
    ...theme.shape.chip,
    borderWidth: theme.border.thin,
    variants: {
      selected: {
        true: {
          backgroundColor: theme.color.interactive.primary.rest,
          borderColor: theme.color.interactive.primary.rest,
        },
        false: {
          backgroundColor: theme.color.bg.raised,
          borderColor: theme.color.border.default,
        },
      },
    },
  },
  progressTrack: {
    height: theme.space[2],
    ...theme.shape.chip,
    backgroundColor: theme.color.bg.sunken,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    ...theme.shape.chip,
    backgroundColor: theme.color.interactive.primary.rest,
  },
  banner: {
    gap: theme.space[1],
    padding: theme.space[3],
    ...theme.shape.notice,
    borderWidth: theme.border.thin,
    variants: {
      bannerTone: {
        info: {
          backgroundColor: theme.color.status.info.bg,
          borderColor: theme.color.status.info.border,
        },
        success: {
          backgroundColor: theme.color.status.success.bg,
          borderColor: theme.color.status.success.border,
        },
        warning: {
          backgroundColor: theme.color.status.warning.bg,
          borderColor: theme.color.status.warning.border,
        },
        danger: {
          backgroundColor: theme.color.status.danger.bg,
          borderColor: theme.color.status.danger.border,
        },
      },
    },
  },
  bannerTitle: {
    variants: {
      bannerTone: {
        info: { color: theme.color.status.info.fg },
        success: { color: theme.color.status.success.fg },
        warning: { color: theme.color.status.warning.fg },
        danger: { color: theme.color.status.danger.fg },
      },
    },
  },
}));
