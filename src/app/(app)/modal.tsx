import { Platform } from 'react-native';
import { router } from 'expo-router';
import { Screen, VStack, Text, Card, Button, Badge } from '@/components/ui';

export default function Modal() {
  return (
    <Screen scroll>
      <VStack gap={2}>
        <Text variant="title">Modal</Text>
        <Text variant="callout" tone="secondary">
          `presentation: &apos;modal&apos;` — the biggest visual divergence between the two
          platforms.
        </Text>
      </VStack>

      <Card>
        <VStack gap={3}>
          <Badge label={Platform.OS === 'ios' ? 'iOS behaviour' : 'Android behaviour'} tone="warning" />
          <Text variant="callout" tone="secondary">
            {Platform.OS === 'ios'
              ? 'A card that stops short of the status bar, with the parent screen scaled back and visible behind it. Drag down anywhere to dismiss. This is UIModalPresentationPageSheet.'
              : 'Android has no card-modal concept, so this presents as a full screen with a slide-up animation. There is no drag-to-dismiss — users rely on the back button. Do not design a flow that depends on seeing the screen behind.'}
          </Text>
        </VStack>
      </Card>

      <Card>
        <VStack gap={2}>
          <Text variant="subheading">When to use it</Text>
          <Text variant="callout" tone="secondary">
            Self-contained tasks that interrupt the main flow — compose, filter, quick edit.
            If the task must not be abandoned accidentally, use `fullScreenModal` instead.
          </Text>
        </VStack>
      </Card>

      <Button label="Done" fullWidth onPress={() => router.back()} />
    </Screen>
  );
}
