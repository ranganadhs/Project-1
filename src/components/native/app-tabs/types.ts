import type { SFSymbol } from 'sf-symbols-typescript';
import type { AndroidSymbol } from 'expo-symbols';
import type {
  NativeTabsTabBarItemRole,
  NativeTabsTabBarMinimizeBehavior,
} from 'expo-router/unstable-native-tabs';
import type { IconName } from '@/components/ui';

/** A value that can differ between the resting and selected state. */
type Stateful<T> = T | { default: T; selected: T };

/**
 * How a tab draws its glyph. A discriminated union rather than three optional
 * props, so "no icon at all" and "half an icon set" are not representable.
 *
 * `sf`/`md` cost no bundled asset and give each platform its own idiomatic
 * glyph. `ion` ships one icon set drawn identically on both platforms — which
 * is the point when the icons carry the product's identity rather than the OS's.
 *
 * Either way the bar is still a real native tab bar, so iOS 26 Liquid Glass is
 * unaffected: `src` feeds the same UITabBarItem that `sf` would.
 */
export type TabIcon =
  /** OS-drawn: SF Symbols on iOS, Material on Android. */
  | { sf: Stateful<SFSymbol>; md: Stateful<AndroidSymbol>; ion?: never }
  /** One Ionicons glyph on both platforms. */
  | { ion: Stateful<IconName>; sf?: never; md?: never };

export type TabConfig = {
  /**
   * Route segment name, matching the file in app/(app)/(tabs).
   *
   * One tab MUST be named 'index' — route groups contribute no path segment, so
   * without it nothing resolves the launch URL '/' and the app opens on
   * expo-router's "Unmatched Route" screen.
   */
  name: string;
  label: string;
  /**
   * 'action' tabs never become selected — they fire `onAction` instead, for
   * Instagram-style centre "+" buttons that open a modal rather than switch
   * tabs. Implemented with `disabled`, which suppresses navigation but still
   * emits tabPress.
   */
  kind?: 'route' | 'action';
  onAction?: () => void;
  /**
   * Short text drawn in the OS badge slot — an unread count, a dot's worth of
   * "new". Absent means no badge; the bar draws nothing for an empty string
   * either, so pass `undefined` rather than `''` to clear it.
   */
  badge?: string;
  /**
   * A system tab bar item: the OS supplies the glyph, the title AND the
   * behaviour. `'search'` is the one that matters on iOS 26 — it becomes the
   * separate search pill beside the bar, and Apple's guidance is that it goes
   * LAST. The system title cannot be overridden; `label` is used only on
   * Android. iOS only; ignored elsewhere.
   */
  role?: NativeTabsTabBarItemRole;
} & TabIcon;

export type AppTabsProps = {
  tabs: TabConfig[];
  /**
   * iOS 26+: whether the Liquid Glass bar shrinks to a pill as the content
   * scrolls. `onScrollDown` is what Safari and Music do; `never` keeps the full
   * bar for a screen where the tabs are the primary navigation. The default,
   * `automatic`, lets the OS decide. No-op on Android and on older iOS.
   */
  minimizeBehavior?: NativeTabsTabBarMinimizeBehavior;
};

export const isActionTab = (tab: TabConfig): boolean => tab.kind === 'action';

/** Narrows to the Ionicons variant. `sf`/`md` are `never` there, so this is safe. */
export const isIonTab = (tab: TabConfig): tab is TabConfig & { ion: Stateful<IconName> } =>
  tab.ion !== undefined;
