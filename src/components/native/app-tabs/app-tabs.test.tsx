// Populates the mocked Unistyles registry with the real themes.
import '@/theme/unistyles';

import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import Ionicons from '@react-native-vector-icons/ionicons';
import { AppTabs } from './app-tabs';
import type { TabConfig } from './types';

/**
 * `NativeTabs.Trigger` does not RENDER its children — it reads them as data and
 * keeps only the elements whose type is exactly `Icon`, `Label` or `Badge`:
 *
 *   Children.toArray(children).filter(c => isValidElement(c) && allowed.includes(c.type))
 *
 * So an icon wrapped in any component of our own — or in a Fragment, which
 * `Children.toArray` does not flatten — is dropped silently. The bar still
 * renders, with labels and no icons, and every gate passes. These tests apply
 * the same filter expo-router does, which is the only way to catch it short of
 * a device.
 */
const ALLOWED = [
  NativeTabs.Trigger.Icon,
  NativeTabs.Trigger.Label,
  NativeTabs.Trigger.Badge,
] as const;

/**
 * React 19 types `ReactElement['props']` as `unknown`, so every prop read below
 * needs a shape. These describe only what the assertions touch — narrow on
 * purpose, so a test reaching for a new prop has to say so.
 */
type TriggerProps = { name?: string; children?: ReactNode };
type IconProps = { src?: unknown; renderingMode?: string };

const keptByNativeTabs = (children: ReactNode) =>
  Children.toArray(children).filter(
    (child): child is ReactElement<IconProps> =>
      isValidElement(child) && (ALLOWED as readonly unknown[]).includes(child.type),
  );

const TABS: TabConfig[] = [
  { name: 'index', label: 'Home', ion: { default: 'home-outline', selected: 'home' } },
  { name: 'single', label: 'Single', ion: 'flag' },
  { name: 'symbol', label: 'Symbol', sf: 'house', md: 'home' },
];

/**
 * Finds the `NativeTabs` element inside whatever AppTabs wraps it in.
 *
 * Searched for by TYPE rather than reached by a fixed path, because AppTabs
 * legitimately wraps the bar in providers — the tab-bar clearance context is
 * one — and a fixed path breaks the moment a provider is added. What these
 * tests are about is the trigger children, so the wrapping above them is free
 * to change.
 */
function findNativeTabs(node: ReactNode): ReactElement<{ children?: ReactNode }> | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement(child)) continue;
    if (child.type === NativeTabs) return child as ReactElement<{ children?: ReactNode }>;
    const nested = findNativeTabs((child.props as { children?: ReactNode }).children);
    if (nested) return nested;
  }
  return undefined;
}

// AppTabs is a function component whose only hook is the mocked useUnistyles,
// so it can be invoked directly to inspect the element tree it builds.
const triggersOf = (tabs: TabConfig[]) => {
  const bar = findNativeTabs(AppTabs({ tabs }));
  if (!bar) throw new Error('AppTabs did not render a NativeTabs element');
  return Children.toArray(bar.props.children).filter(
    isValidElement,
  ) as ReactElement<TriggerProps>[];
};

describe('AppTabs', () => {
  it('gives every tab an Icon that survives expo-router’s child filter', () => {
    for (const trigger of triggersOf(TABS)) {
      const kept = keptByNativeTabs(trigger.props.children);
      expect(kept.map((child) => child.type)).toContain(NativeTabs.Trigger.Icon);
    }
  });

  it('gives every tab a Label that survives it too', () => {
    for (const trigger of triggersOf(TABS)) {
      const kept = keptByNativeTabs(trigger.props.children);
      expect(kept.map((child) => child.type)).toContain(NativeTabs.Trigger.Label);
    }
  });

  /**
   * The badge is the third element type the Trigger keeps. It has to be a
   * DIRECT child for the same reason the icon does, and it must not be
   * committed as an empty badge when a tab has none.
   */
  it('renders a Badge only for tabs that carry one, as a direct child', () => {
    const withBadge: TabConfig[] = [
      { name: 'index', label: 'Home', ion: 'home', badge: '3' },
      { name: 'other', label: 'Other', ion: 'flag' },
    ];
    const [home, other] = triggersOf(withBadge);
    const badgeOf = (trigger?: ReactElement<TriggerProps>) =>
      keptByNativeTabs(trigger?.props.children).find(
        (child) => child.type === NativeTabs.Trigger.Badge,
      );
    expect(badgeOf(home)).toBeTruthy();
    expect((badgeOf(home)?.props as { children?: string }).children).toBe('3');
    expect(badgeOf(other)).toBeUndefined();
  });

  it('forwards role, accessibilityLabel and testID to the trigger', () => {
    const [search] = triggersOf([{ name: 'search', label: 'Search', ion: 'search', role: 'search' }]);
    const props = search?.props as { role?: string; accessibilityLabel?: string; testID?: string };
    expect(props.role).toBe('search');
    expect(props.accessibilityLabel).toBe('Search');
    expect(props.testID).toBe('tab-search');
  });

  it('renders one trigger per tab, named after its route segment', () => {
    const triggers = triggersOf(TABS);
    expect(triggers.map((trigger) => trigger.props.name)).toEqual([
      'index',
      'single',
      'symbol',
    ]);
  });

  /**
   * VectorIcon rasterises the glyph as a WHITE bitmap, so a vector tab icon is
   * only ever visible because iOS re-tints it as a template image. expo-router
   * will infer that from `iconColor`, but nothing fails loudly if the inference
   * stops holding — the icon just turns white on a white Liquid Glass bar.
   */
  it('marks vector icons as template images so the theme can tint them', () => {
    let checked = 0;
    for (const trigger of triggersOf(TABS)) {
      const [icon] = keptByNativeTabs(trigger.props.children).filter(
        (child) => child.type === NativeTabs.Trigger.Icon,
      );
      // SF Symbols are drawn by the OS and carry no bitmap to re-tint.
      if (!icon?.props.src) continue;
      expect(icon.props.renderingMode).toBe('template');
      checked += 1;
    }
    // Without this the test passes when every icon has been dropped — the exact
    // failure the suite exists to catch — because the loop simply finds nothing.
    expect(checked).toBeGreaterThan(0);
  });

  /**
   * ── THE LABELS THAT SAT LOW UNTIL YOU TAPPED ONE ────────────────────────
   * Every unselected tab's label rendered lower than the selected one's on a
   * cold launch, and the first tap on any tab snapped them all into alignment.
   *
   * The cause is one render's delay. `convertSrcOrComponentToSrc` branches on
   * `isValidElement(src)`: an ELEMENT goes to `getImageSource`, which is async,
   * so `useAwaitedScreensIcon` returns `undefined` on the first render and the
   * tab item reaches native with a title and NO IMAGE. A title-only item lays
   * its label out differently. Anything that is NOT an element is passed
   * through and is there on the first commit.
   *
   * ── WHY THE ASSERTION IS SHAPED THIS WAY ─────────────────────────────────
 * Asserting "the src is not a Promise" passes AGAINST the bug: the broken
 * shape holds an ELEMENT in these props, and the promise is only created
 * later inside expo-router. Asserting `isValidElement(src) === false` without
 * a mock fails against the FIX: `getImageSourceSync` needs a native module
 * Jest does not have, so the guard catches it and returns the element.
 *
 * So the sync call is stubbed, and BOTH branches are asserted — the resolved
 * path and the fallback. Neither can see UIKit lay out a label; nothing in
 * Jest can. What they catch is someone putting the element back, and someone
 * removing the guard.
   */
  describe('icon sources are resolved before the first render', () => {
    it('hands native a resolved source rather than an element it must await', () => {
      jest
        .spyOn(Ionicons, 'getImageSourceSync')
        .mockReturnValue({ uri: 'stub://glyph' } as never);

      let checked = 0;
      for (const trigger of triggersOf(TABS)) {
        const [icon] = keptByNativeTabs(trigger.props.children).filter(
          (child) => child.type === NativeTabs.Trigger.Icon,
        );
        const src = icon?.props.src;
        // SF Symbols carry no bitmap and are drawn by the OS.
        if (!src) continue;
        /*
         * ONLY THE VECTOR PATH. `renderingMode: 'original'` marks pre-coloured
         * artwork a call site supplied itself, which never goes through
         * `vectorIcon`, so it is neither resolved nor fallen back by it.
         */
        if (icon?.props.renderingMode !== 'template') continue;

        // A `{ default, selected }` pair is two sources and BOTH must be ready:
        // an unselected tab getting its icon late is the whole bug.
        const sources =
          typeof src === 'object' && src !== null && ('default' in src || 'selected' in src)
            ? Object.values(src as Record<string, unknown>)
            : [src];

        for (const one of sources) {
          expect(isValidElement(one)).toBe(false);
          checked += 1;
        }
      }
      // Without this an empty loop passes — the failure this suite exists for.
      expect(checked).toBeGreaterThan(0);
    });

    /**
     * The sync path skips the font load the async one awaits. If the font is
     * ever not statically linked this throws, and a bar with NO ICONS would be
     * far worse than a low label — so it must degrade to today's behaviour.
     */
    it('falls back to the element when the glyph cannot be resolved', () => {
      jest.spyOn(Ionicons, 'getImageSourceSync').mockImplementation(() => {
        throw new Error('font not loaded');
      });

      let checked = 0;
      for (const trigger of triggersOf(TABS)) {
        const [icon] = keptByNativeTabs(trigger.props.children).filter(
          (child) => child.type === NativeTabs.Trigger.Icon,
        );
        const src = icon?.props.src;
        if (!src) continue;
        /*
         * ONLY THE VECTOR PATH. `renderingMode: 'original'` marks pre-coloured
         * artwork a call site supplied itself, which never goes through
         * `vectorIcon`, so it is neither resolved nor fallen back by it.
         */
        if (icon?.props.renderingMode !== 'template') continue;

        const sources =
          typeof src === 'object' && src !== null && ('default' in src || 'selected' in src)
            ? Object.values(src as Record<string, unknown>)
            : [src];

        for (const one of sources) {
          // The element again — the bug we started with, never a blank bar.
          expect(isValidElement(one)).toBe(true);
          checked += 1;
        }
      }
      expect(checked).toBeGreaterThan(0);
    });
  });
});
