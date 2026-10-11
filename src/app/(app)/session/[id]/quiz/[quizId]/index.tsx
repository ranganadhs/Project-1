import { useLocalSearchParams } from 'expo-router';
import { Screen, Text, VStack } from '@/components/ui';

// Stub — scaffolded to prove navigation before the real screen is built.
// See docs/app-plan.md: pen.dev screens 7–8 "Quiz — Multiple Choice" / "Match Pairs".
export default function QuizRunner() {
  const { id, quizId } = useLocalSearchParams<{ id: string; quizId: string }>();

  return (
    <Screen>
      <VStack gap={2}>
        <Text variant="display">Quiz {quizId}</Text>
        <Text variant="body" tone="secondary">
          Session {id} · multiple choice, match pairs.
        </Text>
      </VStack>
    </Screen>
  );
}
