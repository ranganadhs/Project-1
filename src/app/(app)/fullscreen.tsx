import { Platform, Pressable } from 'react-native';
import { router, Stack } from 'expo-router';
import { Screen, VStack, Text, Card, Button, Badge, Icon, ProgressBar } from '@/components/ui';

export default function FullScreen() {
  return (
    <>
      {/*
        A full-screen modal has no system back affordance, so it must supply its
        own dismissal. Setting it here rather than in the layout keeps the escape
        hatch next to the screen that owns it.
      */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8}>
              <Icon name="close" sf="xmark" size="md" />
            </Pressable>
          ),
        }}
      />
      <Screen scroll>
        <VStack gap={2}>
          <Text variant="title">Full screen modal</Text>
          <Text variant="callout" tone="secondary">
            `presentation: &apos;fullScreenModal&apos;` — covers everything, on both platforms.
          </Text>
        </VStack>

        <Card>
          <VStack gap={3}>
            <Badge label="Same on both platforms" tone="success" />
            <Text variant="callout" tone="secondary">
              {Platform.OS === 'ios'
                ? 'Covers the entire screen including the status bar area. No drag-to-dismiss, so the Close button is the only exit — which is the point.'
                : 'Covers the entire screen. The hardware back button still dismisses it, so guard destructive flows explicitly rather than assuming the user cannot leave.'}
            </Text>
          </VStack>
        </Card>

        <Card>
          <VStack gap={3}>
            <Text variant="subheading">Typical use: a wizard</Text>
            <ProgressBar value={0.4} />
            <Text variant="caption" tone="tertiary">
              Step 2 of 5
            </Text>
          </VStack>
        </Card>

        <Button label="Cancel" tone="danger" variant="soft" fullWidth onPress={() => router.back()} />
      </Screen>
    </>
  );
}
