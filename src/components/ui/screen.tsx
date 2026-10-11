import { useContext, type ReactElement, type ReactNode } from 'react';
import {
  Platform,
  ScrollView,
  View,
  type RefreshControlProps,
  type ScrollViewProps,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { TabBarClearanceContext } from './tab-bar-clearance';

export type ScreenProps = {
  children: ReactNode;
  /** Wraps content in a ScrollView with the right insets. */
  scroll?: boolean;
  /**
   * Keeps the focused input above the keyboard, and scrolls to it on focus.
   *
   * Implies `scroll`. Use it on ANY screen with a text input — without it the
   * keyboard covers the field the user is typing into, which is the single
   * most common broken-form complaint in React Native.
   */
  keyboardAware?: boolean;
  /**
   * With `keyboardAware`: how much room to keep BETWEEN THE CARET and the
   * keyboard. The scroll view follows the caret, not the field — so a form
   * whose action sits below a tall multiline field must reserve that much, or
   * the Send button is left under the keyboard. Defaults to 24.
   */
  keyboardBottomOffset?: number;
  /** Adds horizontal padding. Turn off for edge-to-edge lists. */
  padded?: boolean;
  /**
   * Applies the safe-area TOP inset.
   *
   * Off by default, because most screens sit under a native stack header or a
   * native tab bar and those inset their own content — adding it there would
   * double the gap.
   *
   * Turn it ON for a route with `headerShown: false` that still fills the
   * screen: a `fullScreenModal` draws from the very top of the display, so
   * without this its first row renders UNDER the status bar and collides with
   * the clock and the battery. A `formSheet` does not need it — the sheet is
   * already presented below the status bar.
   */
  topInset?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  /** Pull-to-refresh, from `useRefreshControl`. Scrolling screens only. */
  refreshControl?: ReactElement<RefreshControlProps>;
};

/**
 * Screen container: theme background, safe-area insets, optional scroll and
 * keyboard avoidance.
 *
 * The top inset is opt-in — see `topInset`. The bottom inset is always applied,
 * because nothing else applies it.
 */
export function Screen({
  children,
  scroll = false,
  keyboardAware = false,
  keyboardBottomOffset,
  padded = true,
  topInset = false,
  contentContainerStyle,
  refreshControl,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const tabBarClearance = useContext(TabBarClearanceContext);
  styles.useVariants({ padded });

  // The inset covers the home indicator; the clearance covers a floating tab
  // bar, which the inset does not describe. Zero outside the tabs.
  const bottomInset = insets.bottom + tabBarClearance;

  // ADDED to the screen's own top padding, not replacing it — the inset is the
  // untouchable strip under the status bar, and `layout.screenTop` is the
  // breathing room below that. Collapsing them into one value would put content
  // flush against the notch on a device with a large inset.
  const paddingTop = topInset ? insets.top + theme.layout.screenTop : undefined;

  /*
    ── WHO APPLIES THE INSETS: iOS OR US, NEVER BOTH ──────────────────────────

    The plain ScrollView runs with `contentInsetAdjustmentBehavior="automatic"`
    so UIKit places the pull-to-refresh spinner below the status bar and knows
    the real tab bar. That same setting makes iOS inset the CONTENT by the safe
    area: status bar on top, and home indicator plus tab bar underneath.

    Adding `insets.top` / `insets.bottom + tabBarClearance` on top of that pays
    every gap twice. So on iOS the automatic branch adds only the breathing
    room. Android has no automatic adjustment, so it keeps the manual insets.
  */
  const systemInsets = Platform.OS === 'ios';

  const contentStyle = (auto: boolean) => [
    styles.content,
    { paddingBottom: (auto ? 0 : bottomInset) + theme.layout.screenBottom },
    topInset && !auto ? { paddingTop } : null,
    contentContainerStyle,
  ];

  /*
    A header-less screen (the tabs) scrolls UNDER the status bar — the app is
    edge-to-edge, and on Android nothing is drawn there, so a card slides
    beneath the clock ("Settings" printed over the status icons). A canvas
    strip the height of the inset keeps the clock on a clean surface instead,
    sitting ABOVE the scrolling content and ignoring touches so pull-to-refresh
    still starts from the very top.
  */
  const withStatusStrip = (view: ReactElement) =>
    topInset ? (
      <View style={styles.container}>
        {view}
        <View pointerEvents="none" style={[styles.statusStrip, { height: insets.top }]} />
      </View>
    ) : (
      view
    );

  if (keyboardAware) {
    return withStatusStrip(
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={contentStyle(false)}
        // Header-less (the tabs): we pay the top inset, so iOS must not. Under
        // a native header, leave UIKit to clear it as before.
        contentInsetAdjustmentBehavior={topInset ? 'never' : undefined}
        // Extra room below the focused field so the input is not flush against
        // the keyboard's top edge.
        bottomOffset={keyboardBottomOffset ?? 24}
        refreshControl={refreshControl}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </KeyboardAwareScrollView>,
    );
  }

  if (!scroll) {
    return withStatusStrip(
      <View style={[styles.container, styles.plain, { paddingTop, paddingBottom: bottomInset }]}>
        {children}
      </View>,
    );
  }

  const scrollView = (
    <ScrollView
      style={styles.container}
      contentContainerStyle={contentStyle(systemInsets)}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
  return withStatusStrip(scrollView);
}

/*
  The gutter lives on the CONTENT container, never on the scroll view itself.
  Padding on a ScrollView shrinks its viewport, so anything that reaches the
  edge — a full-bleed image, a horizontal carousel, a card's shadow — is
  clipped at the gutter instead of the screen edge. Padding on the content
  leaves the viewport full-width and only insets what is laid out inside it.
  The non-scrolling branch has no separate content view, so it carries the
  same padding on the one View it renders.
*/
const styles = StyleSheet.create((theme) => ({
  statusStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.color.bg.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: theme.color.bg.canvas,
  },
  plain: {
    variants: {
      padded: {
        true: { paddingHorizontal: theme.layout.gutter },
        false: {},
      },
    },
  },
  content: {
    gap: theme.space[5],
    paddingTop: theme.layout.screenTop,
    variants: {
      padded: {
        true: { paddingHorizontal: theme.layout.gutter },
        false: {},
      },
    },
  },
}));
