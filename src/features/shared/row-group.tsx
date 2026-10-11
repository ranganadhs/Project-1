import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Divider } from '@/components/ui/surfaces';

/**
 * A list of rows in ONE card, split by hairlines — v2's ListView inside a Card.
 *
 * The alternative this replaces was a card per row, 12pt apart: six subjects
 * became six floating slabs, and the gaps between them read as padding rather
 * than as a list. One surface with dividers is what the web product does, and
 * it is denser without being tighter inside a row.
 *
 * Falsy children are skipped, so `{cond && <TapRow/>}` never leaves a doubled
 * divider behind.
 */
export function RowGroup({ children, testID }: { children: ReactNode; testID?: string }) {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={styles.group} testID={testID}>
      {rows.map((row, i) => (
        <Fragment key={row.key ?? i}>
          {i > 0 ? <Divider /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

/**
 * One row of a RowGroup with free-form content. A wash on press rather than a
 * scale: rows sit flush against their neighbours, and a scaling row would
 * visibly overlap them (the same reason `ListItem` does it).
 *
 * Only a TAPPABLE row is one accessibility element; a static one lets
 * VoiceOver reach any control inside it.
 */
export function TapRow({
  onPress,
  accessibilityLabel,
  children,
}: {
  onPress?: () => void;
  accessibilityLabel?: string;
  children: ReactNode;
}) {
  const { theme } = useUnistyles();
  if (!onPress) return <View style={styles.row}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: theme.color.interactive.ghost.pressed }}
      style={({ pressed }) => [
        styles.row,
        pressed && Platform.OS === 'ios'
          ? { backgroundColor: theme.color.interactive.ghost.pressed }
          : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  group: {
    backgroundColor: theme.color.bg.raised,
    ...theme.shape.card,
    borderWidth: theme.border.hairline,
    borderColor: theme.color.border.subtle,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: theme.space[4],
    paddingVertical: theme.space[3],
    gap: theme.space[1],
  },
}));
