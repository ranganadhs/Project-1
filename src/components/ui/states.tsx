import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Text } from './text';

export type EmptyStateProps = {
  title: string;
  /** One sentence: what would fill this, or what to do next. */
  description?: string;
  /** Platform glyph triple, the same contract as `Icon`. */
  icon?: { name: IconName; sf?: SFSymbol; md?: AndroidSymbol };
  /** The one thing a user can do from here. Absent means there is nothing to do. */
  action?: { label: string; onPress: () => void };
  /** Illustration or a Lottie, rendered in place of the icon. */
  children?: ReactNode;
  /** Render inline inside a list or card rather than centred in the screen. */
  compact?: boolean;
  testID?: string;
};

/**
 * A designed EMPTY state, for the third of the four states every screen has.
 *
 * ── THE RULE THIS EXISTS FOR ──────────────────────────────────────────────
 * Loading, error, empty, content. The first three are not "no content" —
 * they are three different facts, and a screen that shows the same blank
 * space for "still fetching" and "you have nothing here yet" is lying about
 * one of them. Empty is a DESIGNED state: it says what belongs here and how
 * to make it appear, and it is the `ListEmptyComponent` a list renders once
 * the first fetch has resolved to nothing — never while `isPending`.
 *
 * Kept deliberately plain: an icon, a title, one line, at most one action.
 * An empty screen is not a place to be clever.
 */
export function EmptyState({
  title,
  description,
  icon = { name: 'file-tray-outline', sf: 'tray', md: 'inbox' },
  action,
  children,
  compact = false,
  testID = 'empty-state',
}: EmptyStateProps) {
  const { theme } = useUnistyles();
  styles.useVariants({ compact });

  return (
    <View style={styles.container} accessibilityRole="summary" testID={testID}>
      {children ?? (
        <View style={styles.glyph}>
          <Icon name={icon.name} sf={icon.sf} md={icon.md} size="xl" color={theme.color.fg.tertiary} />
        </View>
      )}
      <View style={styles.copy}>
        <Text variant="subheading" weight="semibold" align="center">
          {title}
        </Text>
        {description ? (
          <Text variant="body" tone="secondary" align="center">
            {description}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Button label={action.label} variant="soft" size="md" onPress={action.onPress} />
      ) : null}
    </View>
  );
}

export type ErrorStateProps = Omit<EmptyStateProps, 'icon' | 'action'> & {
  /** Wired to the query's `refetch`. Absent only when a retry cannot help. */
  onRetry?: () => void;
  retryLabel?: string;
};

/**
 * The ERROR state: something failed, here is how to try again.
 *
 * A retry is the default action because a network error is the common case
 * and a retry is the honest fix for it. The copy stays calm and specific —
 * `describeError` in `lib/api` produces the description; never surface a raw
 * message from the server or the network stack.
 */
export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try again',
  ...rest
}: Partial<Pick<ErrorStateProps, 'title'>> & Omit<ErrorStateProps, 'title'>) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={{ name: 'alert-circle-outline', sf: 'exclamationmark.triangle', md: 'error' }}
      action={onRetry ? { label: retryLabel, onPress: onRetry } : undefined}
      testID="error-state"
      {...rest}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[4],
    paddingHorizontal: theme.layout.gutter,
    variants: {
      compact: {
        // Inline in a list: enough room to breathe, not a whole screen of it.
        true: { paddingVertical: theme.space[6] },
        // Centred in the screen: pushed up from true centre, which reads as
        // centred — optical centre sits above geometric centre.
        false: { flex: 1, paddingVertical: theme.space[8], paddingBottom: theme.space[12] },
      },
    },
  },
  glyph: {
    width: theme.size.avatar.xl,
    height: theme.size.avatar.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shape.smooth,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.bg.sunken,
  },
  copy: {
    gap: theme.space[1],
    alignItems: 'center',
    maxWidth: theme.layout.measure,
  },
}));
