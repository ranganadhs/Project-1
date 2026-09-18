/**
 * SCAFFOLDING — delete alongside the last fixture.
 *
 * Wraps a fixture as a `queryFn`. Deliberately asynchronous with a small delay
 * rather than returning synchronously: a hook that resolves instantly never
 * renders its own loading state, so every skeleton and spinner in the app would
 * be written blind and first exercised against the real API — which is exactly
 * when you least want to discover one is missing.
 *
 * The delay is short enough not to slow development and long enough that a
 * missing loading state is visible.
 */
const FIXTURE_LATENCY_MS = 350;

export function fixtureQueryFn<T>(value: T): () => Promise<T> {
  return () => new Promise((resolve) => setTimeout(() => resolve(value), FIXTURE_LATENCY_MS));
}
