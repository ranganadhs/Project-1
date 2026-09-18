import { Platform } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { useUnistyles } from 'react-native-unistyles';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export type IconSize = keyof ReturnType<typeof useUnistyles>['theme']['size']['icon'];

export type IconProps = {
  /**
   * Ionicons glyph — the FALLBACK, drawn wherever no platform glyph is given:
   * on web always, and on iOS / Android when `sf` / `md` are absent.
   */
  name: IconName;
  /** SF Symbol. When present, iOS renders this instead — the OS's own glyph set. */
  sf?: SFSymbol;
  /** Material Symbol. When present, Android renders this instead — its own glyph set. */
  md?: AndroidSymbol;
  size?: IconSize;
  color?: string;
};

/**
 * One icon component across platforms, and ONE ICON FAMILY PER PLATFORM.
 *
 * iOS chrome is drawn in SF Symbols and Android chrome in Material Symbols; an
 * icon from a third family beside either reads as imported, however good the
 * glyph. So pass `sf` and `md` together and each platform gets its native
 * set — `expo-symbols` on SDK 57 renders Material Symbols on Android from the
 * font it bundles, so this costs no extra package. `name` (Ionicons) remains
 * the cross-platform fallback and the only set on web. All three unions are
 * type-checked, so a misspelled glyph fails compilation.
 *
 * When the icon IS the product's identity — a custom mark, a brand-specific
 * pictogram — give both platforms the same Ionicons `name` and omit the
 * platform glyphs; that is the one case where sameness beats nativeness.
 */
export function Icon({ name, sf, md, size = 'lg', color }: IconProps) {
  const { theme } = useUnistyles();
  const px = theme.size.icon[size];
  const tint = color ?? theme.color.fg.primary;

  if (Platform.OS === 'ios' && sf) {
    return <SymbolView name={sf} size={px} tintColor={tint} resizeMode="scaleAspectFit" />;
  }

  if (Platform.OS === 'android' && md) {
    return (
      <SymbolView name={{ android: md }} size={px} tintColor={tint} resizeMode="scaleAspectFit" />
    );
  }

  return <Ionicons name={name} size={px} color={tint} />;
}
