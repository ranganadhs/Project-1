// Populates the mocked Unistyles registry with the real themes.
import '@/theme/unistyles';

import type { ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { Platform, Text } from 'react-native';
import { Screen } from './screen';
import { TabBarClearanceContext } from './tab-bar-clearance';
import { light } from '@/theme/themes/light';

/**
 * Guards the safe-area contract.
 *
 * ── THE BUGS THESE EXIST FOR ──────────────────────────────────────────────
 * `Screen` deliberately does NOT apply the top inset, because native stack
 * headers and native tab bars inset their own content. That is correct for
 * almost every screen and WRONG for a `fullScreenModal` with
 * `headerShown: false` — it draws from the very top of the display, so its
 * first row lands under the status bar and collides with the clock and battery.
 *
 * At the other end, the bottom inset describes the home indicator and NOT the
 * iOS 26 floating tab bar, which content passes beneath. A screen inside the
 * tabs needs both, and a screen outside them needs only the inset.
 *
 * Neither is visible to typecheck or lint. These tests are the gate.
 */
const INSETS = { top: 59, bottom: 34, left: 0, right: 0 };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => INSETS,
  SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
}));

const flatten = (style: unknown): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  const walk = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (value && typeof value === 'object') Object.assign(out, value);
  };
  walk(style);
  return out;
};

/** The outermost element that carries padding — the scroller or the plain view. */
/**
 * A `topInset` scroll screen is wrapped (scroller + status-bar strip); the
 * scroller is the first child. Everything else renders the scroller at root.
 */
function scroller(json: unknown): { props: Record<string, unknown> } {
  const node = json as { props?: Record<string, unknown>; children?: { props?: Record<string, unknown> }[] };
  const strip = node?.children?.[1];
  const wrapped = node?.children?.length === 2 && strip?.props?.pointerEvents === 'none';
  return (wrapped ? node.children![0] : node) as { props: Record<string, unknown> };
}

function paddingOf(json: unknown): Record<string, unknown> {
  json = scroller(json);
  const node = json as { props?: Record<string, unknown> };
  const props = node?.props ?? {};
  return flatten(props.contentContainerStyle ?? props.style);
}

describe('Screen top inset', () => {
  it('does not pad the top by default, so it never doubles a native header inset', async () => {
    const { toJSON } = await render(
      <Screen>
        <Text>body</Text>
      </Screen>,
    );
    expect(paddingOf(toJSON()).paddingTop).toBeUndefined();
  });

  it('clears the status bar when topInset is set', async () => {
    const { toJSON } = await render(
      <Screen topInset>
        <Text>body</Text>
      </Screen>,
    );
    // The inset PLUS the screen's own breathing room, not one or the other —
    // collapsing them puts content flush against the notch on a tall device.
    expect(paddingOf(toJSON()).paddingTop).toBe(INSETS.top + light.layout.screenTop);
  });
});

/**
 * ── WHO APPLIES THE INSETS: iOS OR US, NEVER BOTH ──────────────────────────
 *
 * The scrolling branch runs with `contentInsetAdjustmentBehavior="automatic"`,
 * which makes UIKit inset the content by the status bar, home indicator AND
 * tab bar itself. Padding those again doubled every gap: 156pt of empty canvas
 * between the last card and the tab bar, measured on device. On iOS the
 * scroller carries only the breathing room; Android has no automatic
 * adjustment and gets the insets from us.
 */
describe('Screen scrolling insets', () => {
  const inTabs = (node: ReactNode) => (
    <TabBarClearanceContext value={light.size.bar.tab}>{node}</TabBarClearanceContext>
  );

  afterEach(() => jest.restoreAllMocks());

  it('leaves the system insets to iOS and adds only breathing room', async () => {
    const { toJSON } = await render(
      inTabs(
        <Screen scroll topInset>
          <Text>body</Text>
        </Screen>,
      ),
    );
    const json = scroller(toJSON());
    expect(json.props.contentInsetAdjustmentBehavior).toBe('automatic');
    const padding = paddingOf(json);
    expect(padding.paddingTop).toBe(light.layout.screenTop);
    expect(padding.paddingBottom).toBe(light.layout.screenBottom);
  });

  it('applies the insets itself on Android, where nothing adjusts them', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const { toJSON } = await render(
      inTabs(
        <Screen scroll topInset>
          <Text>body</Text>
        </Screen>,
      ),
    );
    const padding = paddingOf(toJSON());
    expect(padding.paddingTop).toBe(INSETS.top + light.layout.screenTop);
    expect(padding.paddingBottom).toBe(
      INSETS.bottom + light.size.bar.tab + light.layout.screenBottom,
    );
  });

  it('applies the insets itself when keyboard-aware, which does not auto-adjust', async () => {
    const { toJSON } = await render(
      <Screen keyboardAware topInset>
        <Text>body</Text>
      </Screen>,
    );
    const padding = paddingOf(toJSON());
    expect(padding.paddingTop).toBe(INSETS.top + light.layout.screenTop);
    expect(padding.paddingBottom).toBe(INSETS.bottom + light.layout.screenBottom);
  });
});

describe('Screen bottom clearance', () => {
  it('applies the safe-area inset alone outside the tabs', async () => {
    const { toJSON } = await render(
      <Screen>
        <Text>body</Text>
      </Screen>,
    );
    expect(paddingOf(toJSON()).paddingBottom).toBe(INSETS.bottom);
  });

  it('adds the tab bar height on top of the inset inside the tabs', async () => {
    const { toJSON } = await render(
      <TabBarClearanceContext value={light.size.bar.tab}>
        <Screen>
          <Text>body</Text>
        </Screen>
      </TabBarClearanceContext>,
    );
    // The inset covers the home indicator; the bar is a separate, floating
    // thing the inset says nothing about.
    expect(paddingOf(toJSON()).paddingBottom).toBe(INSETS.bottom + light.size.bar.tab);
  });
});

/*
  The gutter (`padded`) is a Unistyles VARIANT, and the jest mock strips
  variants and makes `useVariants` a no-op (see jest.setup.js), so where the
  horizontal padding lands cannot be asserted here. The contract — gutter on
  the content container of a scrolling screen, on the one View of a plain
  screen, absent when `padded={false}` — is stated in screen.tsx and needs a
  device to confirm.
*/

describe('Screen status-bar strip', () => {
  it('puts a canvas strip the height of the top inset over a header-less scroll screen', async () => {
    const { toJSON } = await render(
      <Screen scroll topInset>
        <Text>body</Text>
      </Screen>,
    );
    const root = toJSON() as { children: { props: Record<string, unknown> }[] };
    const strip = flatten(root.children[1]!.props.style);
    expect(strip.height).toBe(INSETS.top);
    expect(strip.position).toBe('absolute');
    expect(root.children[1]!.props.pointerEvents).toBe('none');
  });
});
