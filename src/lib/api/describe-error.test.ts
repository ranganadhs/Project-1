import { ApiError, NetworkError, TimeoutError } from './errors';
import { describeSignInFailure, describeLoadFailure } from './describe-error';

describe('describeSignInFailure', () => {
  /**
   * The bug this whole module exists for: an unreachable host produced "check
   * your login ID and password", sending someone off to reset a password that
   * was already correct while the real problem went unmentioned.
   */
  it('does not blame the credentials when the server was never reached', () => {
    expect(describeSignInFailure(new NetworkError(new Error('offline')))).not.toMatch(
      /password|details/i,
    );
    expect(describeSignInFailure(new TimeoutError(30_000))).not.toMatch(/password|details/i);
  });

  it.each([401, 403])('blames the credentials only when the server said so (%i)', (status) => {
    expect(describeSignInFailure(new ApiError(status, 'unauthorized', null))).toMatch(
      /do not match/i,
    );
  });

  it('does not ask the user to retype anything on a server fault', () => {
    const copy = describeSignInFailure(new ApiError(503, 'unavailable', null));
    expect(copy).not.toMatch(/do not match/i);
    expect(copy).toMatch(/trouble/i);
  });

  it('names no cause for a failure it cannot classify', () => {
    expect(describeSignInFailure(new Error('who knows'))).toBe(
      'Could not sign in. Please try again.',
    );
  });
});

describe('describeLoadFailure', () => {
  it('offers retry only where retrying could actually help', () => {
    expect(describeLoadFailure(new NetworkError(new Error('offline'))).retryable).toBe(true);
    expect(describeLoadFailure(new TimeoutError(30_000)).retryable).toBe(true);
    expect(describeLoadFailure(new ApiError(500, 'boom', null)).retryable).toBe(true);
  });

  /**
   * A dead end must not be offered as a button. Retrying a 401 without a
   * refresh flow, or a 404, can only fail again.
   */
  it.each([401, 403, 404])('withholds retry where it is a dead end (%i)', (status) => {
    expect(describeLoadFailure(new ApiError(status, 'nope', null)).retryable).toBe(false);
  });

  it('gives every branch both a title and a message', () => {
    const causes = [
      new NetworkError(new Error('offline')),
      new TimeoutError(30_000),
      new ApiError(401, 'unauthorized', null),
      new ApiError(404, 'missing', null),
      new ApiError(500, 'boom', null),
      new Error('who knows'),
    ];
    for (const cause of causes) {
      const { title, message } = describeLoadFailure(cause);
      expect(title.length).toBeGreaterThan(0);
      expect(message.length).toBeGreaterThan(0);
    }
  });
});
