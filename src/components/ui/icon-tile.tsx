import { View } from 'react-native';
import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Icon, type IconName } from './icon';

export type IconTileTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export type IconTileProps = {
  icon: IconName;
  sf?: SFSymbol;
  md?: AndroidSymbol;
  size?: 'sm' | 'md' | 'lg';
  /**
   * `brand` is the default: one accent across every tile. Hue means STATUS in
   * this app, never category — a course tile is not green because it is a
   * course. Pass a status tone only when the tile reports one.
   */
  tone?: IconTileTone;
};

/** The leading glyph square on a tile, row or card. */
export function IconTile({ icon, sf, md, size = 'md', tone = 'brand' }: IconTileProps) {
  const { theme } = useUnistyles();
  styles.useVariants({ size, tone });
  const ink =
    tone === 'brand'
      ? theme.color.fg.brand
      : tone === 'neutral'
        ? theme.color.fg.secondary
        : theme.color.status[tone].fg;
  return (
    <View style={styles.tile} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Icon name={icon} sf={sf} md={md} size={size === 'sm' ? 'sm' : 'md'} color={ink} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shape.tile,
    variants: {
      size: {
        sm: { width: theme.size.tile.sm, height: theme.size.tile.sm },
        md: { width: theme.size.tile.md, height: theme.size.tile.md },
        lg: { width: theme.size.tile.lg, height: theme.size.tile.lg },
      },
      tone: {
        brand: { backgroundColor: theme.color.bg.brandSubtle },
        neutral: { backgroundColor: theme.color.bg.sunken },
        success: { backgroundColor: theme.color.status.success.bg },
        warning: { backgroundColor: theme.color.status.warning.bg },
        danger: { backgroundColor: theme.color.status.danger.bg },
        info: { backgroundColor: theme.color.status.info.bg },
      },
    },
  },
}));
