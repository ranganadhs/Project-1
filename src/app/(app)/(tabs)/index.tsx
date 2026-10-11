import { Screen, Text, VStack } from '@/components/ui';

// Dummy — see docs/app-plan.md: pen.dev screen 2 "Home" (Learn tab).
//
// topInset: no native header under NativeTabs — these tab screens fill the
// display and need to inset their own top content under the status bar.
export default function Learn() {
  return (
    <Screen topInset>
      <VStack gap={2}>
        <Text variant="display">Learn</Text>
        <Text variant="body" tone="secondary">
          Ask bar, continue-session card, recent sessions.
        </Text>
      </VStack>
    </Screen>
  );
}
