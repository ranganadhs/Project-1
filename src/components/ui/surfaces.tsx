import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from './text';

/** Elevated container. `inset` false lets the card own its own padding. */
export function Card({
  elevation = 'md',
  inset = true,
  style,
  ...rest
}: ViewProps & { elevation?: 'none' | 'sm' | 'md' | 'lg'; inset?: boolean }) {
  styles.useVariants({ elevation, inset });
  return <View style={[styles.card, style]} {...rest} />;
}

/** Hairline rule. */
export function Divider({ inset = false }: { inset?: boolean }) {
  styles.useVariants({ dividerInset: inset });
  return <View style={styles.divider} />;
}

/** Titled group with an optional footnote — the grouped-list idiom. */
export function Section({
  title,
  footnote,
  children,
}: {
  title?: string;
  footnote?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title ? (
        <Text variant="label" tone="secondary" style={styles.sectionTitle}>
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View style={styles.sectionBody}>{children}</View>
      {footnote ? (
        <Text variant="caption" tone="tertiary" style={styles.sectionFootnote}>
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.color.bg.raised,
    ...theme.shape.card,
    borderWidth: theme.border.hairline,
    borderColor: theme.color.border.subtle,
    variants: {
      elevation: {
        none: theme.elevation.none,
        sm: theme.elevation.sm,
        md: theme.elevation.md,
        lg: theme.elevation.lg,
      },
      inset: {
        true: { padding: theme.space[4] },
        false: { padding: theme.space[0], overflow: 'hidden' },
      },
    },
  },
  divider: {
    height: theme.border.hairline,
    backgroundColor: theme.color.border.subtle,
    variants: {
      dividerInset: {
        true: { marginLeft: theme.space[4] },
        false: {},
      },
    },
  },
  section: {
    gap: theme.space[2],
  },
  sectionTitle: {
    paddingHorizontal: theme.space[4],
    letterSpacing: theme.typography.letterSpacing.wide,
  },
  sectionBody: {
    backgroundColor: theme.color.bg.raised,
    ...theme.shape.card,
    borderWidth: theme.border.hairline,
    borderColor: theme.color.border.subtle,
    overflow: 'hidden',
  },
  sectionFootnote: {
    paddingHorizontal: theme.space[4],
  },
}));
