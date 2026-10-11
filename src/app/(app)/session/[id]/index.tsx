import { useLocalSearchParams } from 'expo-router';
import { Screen, Text, VStack } from '@/components/ui';

// Dummy — see docs/app-plan.md: pen.dev screen 6 "Chat with Diagram".
export default function Session() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen>
      <VStack gap={2}>
        <Text variant="display">Session {id}</Text>
        <Text variant="body" tone="secondary">
          Conversation, inline diagram, quick-check prompt.
        </Text>
      </VStack>
    </Screen>
  );
}
