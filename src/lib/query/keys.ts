/**
 * Every React Query key in the app, in one factory.
 *
 * ── WHY A FACTORY AND NOT INLINE ARRAYS ───────────────────────────────────
 * Query keys are compared structurally, so an inline `['profile']` in a hook
 * and an inline `['profile']` in an invalidation are the same key only by
 * coincidence. The moment one of them gains a parameter the other does not, the
 * invalidation silently stops matching and the screen shows stale data with no
 * error anywhere — nothing throws, nothing logs, the number is just wrong.
 * Naming them once removes that failure mode.
 *
 * ── THE PREFIX ────────────────────────────────────────────────────────────
 * Every key starts with the same segment, so a single
 * `invalidateQueries({ queryKey: [ROOT] })` clears the whole app — which is
 * what you want after signing in or out. Change it to your app's name.
 *
 * ── SHAPE ─────────────────────────────────────────────────────────────────
 * Broadest first, narrowing left to right: `[ROOT, 'feature', 'detail', id]`.
 * That ordering is what makes partial invalidation work — invalidating
 * `keys.feature.all()` also matches every detail beneath it.
 *
 * `as const` on every return value keeps the tuples literal, so a typo in a
 * key is a type error rather than a cache miss at runtime.
 *
 * These two entries are examples. Replace them; keep the shape.
 */
const ROOT = 'app';

export const keys = {
  /** Everything. For sign-in and sign-out. */
  all: () => [ROOT] as const,

  profile: {
    all: () => [ROOT, 'profile'] as const,
    detail: (id: string) => [ROOT, 'profile', 'detail', id] as const,
  },
} as const;
