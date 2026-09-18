import { Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, VStack, Text, Card, Button, Badge } from '@/components/ui';

export default function Detail() {
  const { from } = useLocalSearchParams<{ from?: string }>();

  return (
    <Screen scroll>
      <VStack gap={2}>
        <Text variant="title">Pushed onto the stack</Text>
        <Text variant="callout" tone="secondary">
          Opened from {from ?? 'unknown'}. This is the default `push` presentation.
        </Text>
      </VStack>

      <Card>
        <VStack gap={3}>
          <Badge label={Platform.OS === 'ios' ? 'iOS behaviour' : 'Android behaviour'} tone="brand" />
          <Text variant="callout" tone="secondary">
            {Platform.OS === 'ios'
              ? 'Slides in from the trailing edge. Swipe from the left screen edge to go back — the gesture is interactive and follows your finger. The header back button shows the previous screen’s title unless suppressed.'
              : 'Slides up and fades per Material motion. The hardware and gesture back both pop the screen. Android has no interactive edge-swipe by default; predictive back is opt-in.'}
          </Text>
        </VStack>
      </Card>

      <Card>
        <VStack gap={3}>
          <Text variant="subheading">Push another</Text>
          <Text variant="callout" tone="secondary">
            Stacks are unbounded. Each push adds to the history the back button walks.
          </Text>
          <Button
            label="Push one more"
            variant="outline"
            onPress={() => router.push('/detail?from=detail')}
          />
        </VStack>
      </Card>

      <Button label="Back to tabs" tone="neutral" onPress={() => router.dismissTo('/')} />
    </Screen>
  );
}
