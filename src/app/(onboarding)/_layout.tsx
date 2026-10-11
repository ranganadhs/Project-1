import { Stack } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

/**
 * Single-screen group — the first-run gate itself. Still needs a Stack (not a
 * bare redirect) so expo-router has something to resolve the group's root to.
 */
export default function OnboardingLayout() {
  const { theme } = useUnistyles();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.color.bg.canvas },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="model-setup" />
    </Stack>
  );
}
