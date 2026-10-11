import { Screen, Text, VStack } from '@/components/ui';

// Dummy — see docs/app-plan.md: pen.dev screen 3 "Sessions" (list).
export default function Sessions() {
  return (
    <Screen topInset>
      <VStack gap={2}>
        <Text variant="display">Sessions</Text>
        <Text variant="body" tone="secondary">
          Full session list with filters.
        </Text>
      </VStack>
    </Screen>
  );
}
