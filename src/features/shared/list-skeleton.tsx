import { Card } from '@/components/ui/surfaces';
import { Skeleton } from '@/components/ui/skeleton';
import { VStack } from '@/components/ui/stack';

/** Placeholder rows shaped like the content, never a lone spinner. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <VStack gap={3} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: rows }, (_, i) => (
        <Card key={i}>
          <VStack gap={2}>
            <Skeleton width="60%" height={18} />
            <Skeleton width="40%" height={14} />
          </VStack>
        </Card>
      ))}
    </VStack>
  );
}
