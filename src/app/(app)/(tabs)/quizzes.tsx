import { Screen, Text, VStack } from '@/components/ui';

// Dummy — see docs/app-plan.md: pen.dev screen 4 "Quizzes" (list).
export default function Quizzes() {
  return (
    <Screen topInset>
      <VStack gap={2}>
        <Text variant="display">Quizzes</Text>
        <Text variant="body" tone="secondary">
          Streak card, ready-to-review and completed quizzes.
        </Text>
      </VStack>
    </Screen>
  );
}
