import type { ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from './text';
import { Icon } from './icon';

export type ListItemProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Shows the platform disclosure chevron and makes the row pressable. */
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

/**
 * A grouped-list row. Pressed feedback is a background wash rather than a
 * scale, because rows sit flush against neighbours and a scaling row would
 * visibly overlap them.
 */
export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  destructive = false,
  disabled = false,
}: ListItemProps) {
  const { theme } = useUnistyles();
  styles.useVariants({ disabled });

  const content = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.body}>
        <Text variant="body" tone={destructive ? 'danger' : 'primary'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="label" tone="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? null}
      {onPress && !trailing ? (
        <Icon
          name="chevron-forward"
          sf="chevron.right"
          size="sm"
          color={theme.color.fg.tertiary}
        />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      // Android gets its native ripple; iOS gets the standard grey wash.
      android_ripple={{ color: theme.color.interactive.ghost.pressed }}
      style={({ pressed }) => [
        styles.row,
        pressed && Platform.OS === 'ios'
          ? { backgroundColor: theme.color.interactive.ghost.pressed }
          : null,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    minHeight: theme.size.touchTarget,
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[4],
    backgroundColor: theme.color.bg.raised,
    variants: {
      disabled: {
        true: { opacity: theme.opacity.disabled },
        false: {},
      },
    },
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: theme.space[0.5],
  },
}));
