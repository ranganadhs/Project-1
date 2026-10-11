import { DynamicColorIOS, Platform, type ColorValue } from 'react-native';
import { colorDark } from './themes/color-dark';
import { colorLight, type ThemeColor } from './themes/color-light';

/**
 * A theme colour for NATIVE chrome (stack headers, the tab bar), resolved by
 * the OS rather than by React.
 *
 * Passed as a plain string from `useUnistyles()`, a header's colour changes
 * only after React re-renders the navigator — measured 2026-09-30 at ~27
 * frames (0.9s) of a half-switched header after the page had already flipped
 * (trap 12). A `DynamicColorIOS` carries BOTH values; UIKit swaps them in the
 * same frame the window's appearance flips, which `theme-mode.ts` now sets.
 *
 * Android has no dynamic colour for these props, so it takes the current
 * theme's value and keeps the render-late behaviour.
 */
export function nativeColor(pick: (c: ThemeColor) => string, current: ThemeColor): ColorValue {
  return Platform.OS === 'ios' ? DynamicColorIOS({ light: pick(colorLight), dark: pick(colorDark) }) : pick(current);
}
