import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { SpaceKey } from '@/theme';

type StackProps = ViewProps & {
  /** Token key from theme.space — not a raw number. */
  gap?: SpaceKey;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  wrap?: boolean;
  children?: ReactNode;
};

/**
 * `gap` is a runtime prop, so it cannot be a static variant. Reading the theme
 * through useUnistyles is the supported way to resolve a token from a prop.
 */
function useGap(gap: SpaceKey): number {
  const { theme } = useUnistyles();
  return theme.space[gap];
}

/** Vertical layout. */
export function VStack({ gap = 0, align, justify, wrap, style, ...rest }: StackProps) {
  const gapValue = useGap(gap);
  return (
    <View
      style={[
        styles.column,
        {
          gap: gapValue,
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Horizontal layout. Defaults to centre cross-axis alignment. */
export function HStack({ gap = 0, align = 'center', justify, wrap, style, ...rest }: StackProps) {
  const gapValue = useGap(gap);
  return (
    <View
      style={[
        styles.row,
        {
          gap: gapValue,
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Pushes siblings apart inside a stack. */
export function Spacer() {
  return <View style={styles.spacer} />;
}

const styles = StyleSheet.create(() => ({
  column: { flexDirection: 'column' },
  row: { flexDirection: 'row' },
  spacer: { flex: 1 },
}));
