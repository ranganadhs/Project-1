import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

/**
 * Every navigation presentation the boilerplate demonstrates lives here, so the
 * platform differences are visible in one file.
 *
 * Presentations available from react-native-screens:
 *   push · modal · pageSheet · formSheet · fullScreenModal ·
 *   transparentModal · containedModal · containedTransparentModal
 */
export default function AppLayout() {
  const { theme } = useUnistyles();
  /*
    Reduce Motion means FEWER AND GENTLER, not none. Opacity still changes —
    a screen that appears with no transition at all reads as a glitch — but
    nothing slides, scales or overshoots. The native stack's `fade` is the
    platform's own answer to that setting, so every presentation below that
    would otherwise slide falls back to it. Per-screen `animation` overrides
    have to read the same flag, which is why `fullscreen` does.

    Read once at mount, which is how Reanimated exposes it; the setting is
    toggled in the OS Settings app, never mid-flow.
  */
  const reducedMotion = useReducedMotion();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reducedMotion ? 'fade' : undefined,
        headerTintColor: theme.color.interactive.primary.rest,
        headerStyle: { backgroundColor: theme.color.bg.canvas },
        headerTitleStyle: { color: theme.color.fg.primary },
        contentStyle: { backgroundColor: theme.color.bg.canvas },
      }}
    >
      <Stack.Screen name="(tabs)" />

      {/* Pushed from Settings — see src/lib/permissions. */}
      <Stack.Screen
        name="permissions"
        options={{
          headerShown: true,
          title: 'Permissions',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      {/*
        PUSH — the default. Slides in from the trailing edge on iOS with an
        interactive back-swipe; on Android it fades/slides per the platform
        animation and the hardware back button pops it.
      */}
      <Stack.Screen
        name="detail"
        options={{
          headerShown: true,
          title: 'Pushed screen',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      {/*
        MODAL — iOS presents a card that stops short of the top and leaves the
        parent visible behind it, dismissible by dragging down. Android has no
        card-modal concept, so it presents as a full screen.
      */}
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Modal',
        }}
      />

      {/*
        FORM SHEET — the real native bottom sheet, no third-party library.
        Detents are fractions of screen height. iOS accepts any number of them;
        ANDROID IS CAPPED AT THREE and ignores the rest.
        `sheetGrabberVisible` and `sheetCornerRadius` are iOS-only.
      */}
      <Stack.Screen
        name="sheet"
        options={{
          presentation: 'formSheet',
          headerShown: false,
          sheetAllowedDetents: [0.35, 0.6, 0.95],
          sheetInitialDetentIndex: 0,
          sheetGrabberVisible: true,
          sheetCornerRadius: theme.radius['3xl'],
          sheetExpandsWhenScrolledToEdge: true,
          // Leaves the first detent undimmed so the screen behind stays usable —
          // the "peek" interaction Maps and Music use.
          sheetLargestUndimmedDetentIndex: 0,
        }}
      />

      {/*
        FULL SCREEN MODAL — covers everything on both platforms, no drag to
        dismiss. Use it for flows that must be completed or explicitly cancelled.
      */}
      <Stack.Screen
        name="fullscreen"
        options={{
          presentation: 'fullScreenModal',
          headerShown: true,
          title: 'Full screen',
          // iOS has no back affordance here by default; the screen supplies its
          // own Close button.
          headerBackVisible: false,
          animation: reducedMotion
            ? 'fade'
            : Platform.OS === 'ios'
              ? 'slide_from_bottom'
              : 'fade_from_bottom',
        }}
      />

      {/*
        TRANSPARENT MODAL — the route renders over the previous screen with a
        transparent background, so you draw your own scrim. This is how you build
        custom dialogs, toasts, and spotlight overlays as real routes.

        `contentStyle` MUST be re-declared transparent here, and it is the one
        presentation that needs it. The native stack skips its own theme
        background for `transparentModal` — and then appends whatever
        `contentStyle` the options carry:

          contentStyle: [
            presentation !== 'transparentModal' && { backgroundColor: colors.background },
            contentStyle,
          ]

        So the `bg.canvas` this Stack sets for every screen lands on the modal
        too and fills it solid. The scrim then darkens that canvas instead of the
        screen behind it, and the dialog reads as flat white in light and flat
        black in dark — through a clean typecheck, lint and bundle.
      */}
      <Stack.Screen
        name="dialog"
        options={{
          presentation: 'transparentModal',
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: theme.color.bg.transparent },
        }}
      />
    </Stack>
  );
}
