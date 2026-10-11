import { useLocalSearchParams } from 'expo-router';
import { Screen, Text, VStack } from '@/components/ui';

// Stub — scaffolded to prove navigation before the real screen is built.
// See docs/app-plan.md: pen.dev screen 9 "Results and Mastery" (fullScreenModal).
export default function QuizResults() {
  const { quizId } = useLocalSearchParams<{ id: string; quizId: string }>();

  return (
    <Screen>
      <VStack gap={2}>
        <Text variant="display">Results</Text>
        <Text variant="body" tone="secondary">
          Quiz {quizId} · score ring, breakdown, concept mastery.
        </Text>
      </VStack>
    </Screen>
  );
}
