// Side-effect import: StyleSheet.configure() MUST run before any
// StyleSheet.create() call. The router loads this module first, so putting it
// at the top of the root layout guarantees the ordering.
import '@/theme/unistyles';

import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router/react-navigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SystemBars } from 'react-native-edge-to-edge';
import { useUnistyles } from 'react-native-unistyles';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { QueryProvider } from '@/lib/query';
import { useSession } from '@/lib/auth';
import { useSystemBarsStore } from '@/theme/system-bars';
import { UpdateBanner } from '@/components/updates/update-banner';

// Hold the native splash until the app knows what to render, so the user never
// sees an empty frame or the wrong screen. Paired with hideAsync() below.
//
// The fade dissolves the native splash into the first screen instead of hard
// cutting — it is one line and it is most of what makes launch feel finished.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden (fast refresh). Not an error.
});
SplashScreen.setOptions({ duration: 300, fade: true });

function RootNavigator() {
  const { theme, rt } = useUnistyles();
  const { isAuthenticated, isHydrated } = useSession();
  const isDark = rt.themeName === 'dark';
  // `null` unless a focused screen is asking for different ink. See below.
  const systemBarsOverride = useSystemBarsStore((state) => state.override);

  // Paint the NATIVE root view, not just the React tree.
  //
  // Screen containers created by react-native-screens default to white. During
  // a tab switch or a push, that white is on screen for a frame before the
  // themed View paints over it. Normally you would never notice — but the iOS 26
  // liquid-glass tab bar is TRANSLUCENT and samples what is behind it, so it
  // picks up that white and reads as light mode for exactly that frame.
  //
  // Setting the root background to the canvas colour means the frame underneath
  // is already correct, so there is nothing light for the glass to sample.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.color.bg.canvas);
  }, [theme.color.bg.canvas]);

  // Hold rendering until persisted session state is known, so a signed-in user
  // never sees the sign-in screen flash before the guard resolves. Painted with
  // the canvas colour rather than returning null — null leaves the bare native
  // root visible, which is the same white-frame problem in a different place.
  // Reveal the app only once the session is known. Hiding the splash any
  // earlier shows a frame of the wrong screen before the guard resolves.
  useEffect(() => {
    if (isHydrated) void SplashScreen.hideAsync().catch(() => {});
  }, [isHydrated]);

  if (!isHydrated) {
    return <View style={{ flex: 1, backgroundColor: theme.color.bg.canvas }} />;
  }

  return (
    // React Navigation's ThemeProvider MUST mirror the active scheme. Without it
    // the navigator falls back to the built-in light theme, and iOS 26
    // liquid-glass header chrome renders light for one frame on every push
    // before flipping to the screen's own style — a visible flicker.
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {/*
        Driven by OUR resolved theme, never `style="auto"`.

        `auto` resolves from Appearance.getColorScheme() — the OS setting — not
        from the app's theme. The moment a user picks Light or Dark in Settings
        while their phone is on the opposite scheme, `auto` produces dark icons
        on a dark background (or light on light) and the status bar vanishes.

        Naming is CONTENT colour, not background: 'light' means light icons, so
        a dark canvas needs 'light'. Reading it as "the theme name" inverts it.

        SystemBars covers the Android navigation bar as well as the status bar,
        which is why it is used here rather than expo-status-bar — on an
        edge-to-edge app the gesture pill needs the same treatment.

        THIS IS THE ONLY <SystemBars> IN THE APP, and it must stay that way.
        System chrome is global state; a second instance inside a screen races
        this one, and because it unmounts with navigation the damage shows on
        the screen you go BACK to, not the one that set it. A screen that needs
        different ink DECLARES it with `useSystemBarsOverride()` and this
        resolves `override ?? theme`. See src/theme/system-bars.ts.
      */}
      <SystemBars style={systemBarsOverride ?? (isDark ? 'light' : 'dark')} />
      <Stack screenOptions={{ headerShown: false }}>
        {/*
          Declarative guards. Flipping a guard is what drives navigation and
          wipes protected history — there is no router.replace anywhere in this
          codebase, and there should not be.
        */}
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)/sign-in" />
        </Stack.Protected>

        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>

      {/*
        A SIBLING of the navigator, not a child of any screen.

        A forced over-the-air update is a property of the APP, not of whatever
        route happens to be mounted — inside a screen it would vanish on the
        next push. Declared after <Stack> so it paints over it.

        It still cannot cover the native tab bar: that is an OS window and
        outranks every React Native view regardless of zIndex, which is why the
        banner anchors to the TOP. See the component for the full reasoning.

        Renders null for every silent update, which is nearly all of them, and
        for every build without EAS Update configured, which is all of them
        until you set it up.
      */}
      <UpdateBanner />
    </ThemeProvider>
  );
}

/**
 * Provider order is load-bearing:
 *   gestures wrap everything so the root view receives touches;
 *   safe-area resolves before any screen measures;
 *   query is available to anything that fetches;
 *   keyboard wraps the navigator so every screen inherits its context.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <KeyboardProvider>
            <RootNavigator />
          </KeyboardProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
