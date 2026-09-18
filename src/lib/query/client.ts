import { QueryClient } from '@tanstack/react-query';
// Leaf import: the '@/lib/api' barrel constructs the default client from `env`
// at module load, which this module has no need to trigger.
import { ApiError } from '@/lib/api/errors';

const MAX_RETRIES = 3;

/** 1s, 2s, 4s, 8s … capped at 30s. */
export function exponentialBackoff(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30_000);
}

/**
 * Retries only failures that could plausibly succeed on a second attempt.
 * A 404 or 400 fails identically every time, so retrying it just delays the
 * error the user needs to see.
 */
export function retryPolicy(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (error instanceof ApiError) return error.isRetryable;
  return true; // network/timeout failures are transient
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      // Serve cached data when offline instead of failing the query outright.
      networkMode: 'offlineFirst',
      retry: retryPolicy,
      retryDelay: exponentialBackoff,
      // Both are INERT until QueryProvider wires the managers — see the note there.
      refetchOnWindowFocus: true,
      refetchOnReconnect: 'always',
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 1,
      retryDelay: exponentialBackoff,
    },
  },
});
