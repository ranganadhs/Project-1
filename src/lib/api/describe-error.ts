import { ApiError, NetworkError, TimeoutError } from './errors';

/**
 * Turns a failure into copy the user can act on.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * Written after watching a simulator do the wrong thing. With the API URL still
 * pointing at a placeholder host, an UNREACHABLE SERVER produced "Could not
 * sign in. Check your login ID and password" — which sends someone off to reset
 * a password that was already correct, while the actual problem (no route to
 * the server) goes unmentioned.
 *
 * The rule this encodes: **only say what the failure actually established.**
 * "Check your credentials" belongs to the two statuses that mean wrong
 * credentials, and nothing else. The fallback deliberately blames nothing.
 *
 * Lives here rather than inside a screen so it can be tested as a pure
 * function — the alternative is driving a simulator into six failure modes.
 *
 * Rewrite the strings to your product's voice; keep the branching.
 */

/** The app's name, as it should appear in user-facing failure copy. */
const APP = 'the app';

export function describeSignInFailure(cause: unknown): string {
  if (cause instanceof NetworkError) {
    return `Can't reach ${APP}. Check your connection and try again.`;
  }
  if (cause instanceof TimeoutError) {
    return `${APP} took too long to respond. Try again in a moment.`;
  }

  if (cause instanceof ApiError) {
    // The ONLY two statuses that actually mean "wrong credentials".
    if (cause.status === 401 || cause.status === 403) {
      return 'Those details do not match. Check them and try again.';
    }
    // The server's fault. Telling someone to check their password here is a
    // lie, and retyping it cannot help.
    if (cause.status >= 500) {
      return `${APP} is having trouble right now. Try again shortly.`;
    }
  }

  return 'Could not sign in. Please try again.';
}

export type LoadFailure = {
  title: string;
  message: string;
  /** False when retrying cannot possibly help, so the button is not offered. */
  retryable: boolean;
};

/**
 * The same rule applied to reads.
 *
 * ── THE 401 CASE ──────────────────────────────────────────────────────────
 * On a screen, a 401 usually means the session ended. Whether retrying can help
 * depends on whether your auth adapter implements `refresh` — if it does not,
 * retrying is a dead end and the button should be withheld rather than offered.
 * That is why `retryable` is false here by default.
 */
export function describeLoadFailure(cause: unknown): LoadFailure {
  if (cause instanceof NetworkError) {
    return {
      title: `Can't reach ${APP}`,
      message: 'Check your connection and try again.',
      retryable: true,
    };
  }

  if (cause instanceof TimeoutError) {
    return {
      title: 'This is taking too long',
      message: `${APP} did not respond in time. Try again in a moment.`,
      retryable: true,
    };
  }

  if (cause instanceof ApiError) {
    if (cause.status === 401 || cause.status === 403) {
      return {
        title: 'Your session has ended',
        message: 'Sign in again to pick up where you left off.',
        retryable: false,
      };
    }
    if (cause.status === 404) {
      return {
        title: 'Not found',
        message: 'This may have been removed since you last opened it.',
        retryable: false,
      };
    }
    if (cause.status >= 500) {
      return {
        title: `${APP} is having trouble`,
        message: 'The problem is on our side, not yours. Try again shortly.',
        retryable: true,
      };
    }
  }

  // Reached by unknown failures. Names no cause, because none is established.
  return {
    title: "Couldn't load this",
    message: 'Something went wrong. Try again.',
    retryable: true,
  };
}
