import type { ApiClient } from './client';

/**
 * Refuses non-GET requests unless writes have been explicitly enabled.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * During development the configured host is very often a REAL environment
 * holding real people's data. Against one of those, a single stray tap can
 * create a row for a real user, spend money on whatever the write triggers, and
 * leave something with no undo. The risk is highest exactly when it is least
 * visible: pointing `EXPO_PUBLIC_API_URL` at staging or production to check one
 * read, then tapping through a flow out of habit.
 *
 * Asking each screen to remember means the guarantee is only as good as the
 * newest screen. One interlock in the client is a single place to reason about
 * and a single place to flip.
 *
 * ── FAILS CLOSED, AND THROWS RATHER THAN NO-OPS ───────────────────────────
 * A silently swallowed write is far worse than a loud refusal: the UI would
 * show a successful submission, the user would believe it was recorded, and
 * nothing would exist. So this throws, the mutation rejects, and the screen's
 * error path runs — which is the honest outcome.
 *
 * ── WHAT THIS IS NOT ──────────────────────────────────────────────────────
 * Not a security control. Any flag driving it is an `EXPO_PUBLIC_*` value,
 * readable and changeable by anyone holding the bundle, and it is not trying to
 * stop them. It stops an ACCIDENT, which is the actual risk.
 *
 * ── USING IT ──────────────────────────────────────────────────────────────
 * Wrap the client where it is constructed, in `src/lib/api/index.ts`:
 *
 *   export const api = guardWrites(
 *     createApiClient({ baseUrl: env.apiUrl, ... }),
 *     () => env.allowWrites,
 *   );
 *
 * Delete the wrapper — not the file — once the app talks only to an
 * environment where a write is cheap and reversible.
 */

export class WritesDisabledError extends Error {
  constructor(
    readonly method: string,
    readonly path: string,
  ) {
    super(
      `Writes are disabled: refused ${method} ${path}. ` +
        `The API host may point at a real environment where this would create ` +
        `real data. Enable writes explicitly to allow it.`,
    );
    this.name = 'WritesDisabledError';
  }
}

/**
 * Wraps a client so its mutating methods refuse while `allowWrites()` is false.
 *
 * `get` is passed through untouched by reference — reads are never gated, and
 * routing them through a wrapper would add a call frame for no reason.
 *
 * The flag is read through a FUNCTION rather than a boolean so it can be
 * flipped at runtime, and so a test can change it between cases without
 * re-importing the module.
 */
export function guardWrites(client: ApiClient, allowWrites: () => boolean): ApiClient {
  const refuse =
    <T extends (...args: never[]) => unknown>(method: string, actual: T): T =>
      ((...args: Parameters<T>) => {
        if (!allowWrites()) {
          // `args[0]` is the path for every method on ApiClient.
          throw new WritesDisabledError(method, String(args[0]));
        }
        return actual(...args);
      }) as T;

  return {
    get: client.get,
    post: refuse('POST', client.post),
    put: refuse('PUT', client.put),
    patch: refuse('PATCH', client.patch),
    delete: refuse('DELETE', client.delete),
  };
}
