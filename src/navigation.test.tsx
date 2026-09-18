// Populates the mocked Unistyles registry with the real themes.
import '@/theme/unistyles';

import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Stack } from 'expo-router';
import AppLayout from '@/app/(app)/_layout';

/**
 * A `transparentModal` is only transparent if NOTHING paints a floor under it.
 *
 * The native stack skips its own theme background for that presentation — and
 * then appends whatever `contentStyle` the options carry:
 *
 *   contentStyle: [
 *     presentation !== 'transparentModal' && { backgroundColor: colors.background },
 *     contentStyle,
 *   ]
 *
 * So a stack-wide `screenOptions.contentStyle` — which this layout sets, to keep
 * pushed screens on the canvas colour — lands on the modal too and fills it
 * solid. The route then draws its alpha scrim over an opaque canvas instead of
 * over the screen behind it, and reads as flat white in light and flat black in
 * dark — through a clean typecheck, lint and bundle.
 *
 * This asserts the invariant for EVERY transparent presentation rather than for
 * the `dialog` route by name, so a new overlay route inherits the guard.
 *
 * It lives here rather than beside the layout because expo-router's require
 * context does not exclude `.test.tsx`: a test file under `src/app` becomes a
 * route.
 */
const TRANSPARENT_PRESENTATIONS = ['transparentModal', 'containedTransparentModal'];

type ScreenProps = { name?: string; options?: Record<string, unknown> };
type StackProps = { screenOptions?: Record<string, unknown>; children?: ReactNode };

function screensOf(node: ReactNode) {
  if (!isValidElement(node) || node.type !== Stack) {
    throw new Error('(app)/_layout no longer returns a <Stack> at its root');
  }
  const stack = node as ReactElement<StackProps>;
  const screens = Children.toArray(stack.props.children).filter(
    (child): child is ReactElement<ScreenProps> =>
      isValidElement(child) && child.type === Stack.Screen,
  );
  return { stack, screens };
}

/** What the native stack ends up handing the screen: stack options, then the screen's. */
const resolvedContentStyle = (
  stackOptions: Record<string, unknown> | undefined,
  screenOptions: Record<string, unknown> | undefined,
): ViewStyle =>
  StyleSheet.flatten([
    stackOptions?.contentStyle,
    screenOptions?.contentStyle,
  ] as StyleProp<ViewStyle>) ?? {};

describe('(app) layout presentations', () => {
  // AppLayout's only hook is the mocked useUnistyles, so it can be invoked
  // directly to inspect the element tree it builds.
  const { stack, screens } = screensOf(AppLayout());

  const overlays = screens.filter((screen) =>
    TRANSPARENT_PRESENTATIONS.includes(String(screen.props.options?.presentation)),
  );

  it('demonstrates a transparent presentation at all', () => {
    expect(overlays.map((screen) => screen.props.name)).toContain('dialog');
  });

  it('leaves no opaque fill under a transparent presentation', () => {
    for (const overlay of overlays) {
      const { backgroundColor } = resolvedContentStyle(
        stack.props.screenOptions,
        overlay.props.options,
      );
      expect(`${overlay.props.name}: ${String(backgroundColor)}`).toBe(
        `${overlay.props.name}: transparent`,
      );
    }
  });

  it('keeps the opaque canvas on every other presentation', () => {
    const canvas = resolvedContentStyle(stack.props.screenOptions, undefined).backgroundColor;
    expect(canvas).toBeDefined();
    expect(canvas).not.toBe('transparent');
  });
});
