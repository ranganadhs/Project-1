import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

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

      {/* PUSH — chat opens from the Learn tab's ask bar or a session row. */}
      <Stack.Screen
        name="session/[id]/index"
        options={{
          headerShown: true,
          title: 'Session',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      {/* PUSH — quiz runner opens from a chat's quick-check prompt. */}
      <Stack.Screen
        name="session/[id]/quiz/[quizId]/index"
        options={{
          headerShown: true,
          title: 'Quiz',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      {/*
        FULL SCREEN MODAL — results must be acknowledged (Review mistake /
        Next topic) before returning to the chat, so it covers everything on
        both platforms with no drag-to-dismiss.
      */}
      <Stack.Screen
        name="session/[id]/quiz/[quizId]/results"
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
          animation: reducedMotion
            ? 'fade'
            : Platform.OS === 'ios'
              ? 'slide_from_bottom'
              : 'fade_from_bottom',
        }}
      />
    </Stack>
  );
}
