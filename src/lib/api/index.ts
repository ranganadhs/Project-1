import { createApiClient } from './client';
import { env } from '@/lib/env';
import { getAuthToken, useSessionStore } from '@/lib/auth';

export * from './errors';
export { createApiClient, type ApiClient, type ApiClientConfig } from './client';
export { queryString } from './query-string';
export { guardWrites, WritesDisabledError } from './write-guard';
export {
  describeSignInFailure,
  describeLoadFailure,
  type LoadFailure,
} from './describe-error';

/**
 * The default instance, bound to the session.
 *
 * NOTE: importing this barrel constructs the client and therefore evaluates
 * `env`, which throws when EXPO_PUBLIC_API_URL is unset. Tooling and unit tests
 * that only need the error classes should import '@/lib/api/errors' directly.
 */
export const api = createApiClient({
  baseUrl: env.apiUrl,
  getAuthToken,
  onUnauthorized: () => {
    // Clearing the session flips the route guard, which navigates and wipes
    // protected history. No imperative redirect is needed anywhere.
    void useSessionStore.getState().signOut();
  },
});
