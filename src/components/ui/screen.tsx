import { useContext, type ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
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
  padded = true,
  topInset = false,
  contentContainerStyle,
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
  //
  // The SAME total in both the scrolling and non-scrolling branches, which
  // matters more than it looks: a screen that toggles `scroll` between states
  // would visibly jump its header at the moment it switched.
  const paddingTop = topInset ? insets.top + theme.layout.screenTop : undefined;

  const contentStyle = [
    styles.content,
    { paddingBottom: bottomInset + 24 },
    topInset ? { paddingTop } : null,
    contentContainerStyle,
  ];

  if (keyboardAware) {
    return (
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={contentStyle}
        // Extra room below the focused field so the input is not flush against
        // the keyboard's top edge.
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </KeyboardAwareScrollView>
    );
  }

  if (!scroll) {
    return (
      <View style={[styles.container, styles.plain, { paddingTop, paddingBottom: bottomInset }]}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={contentStyle}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
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
