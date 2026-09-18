/** A response the server returned that was not 2xx. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly body: unknown;

  constructor(status: number, code: string, body: unknown, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.body = body;
  }

  /**
   * 5xx and 429 may succeed on a retry; a 4xx will fail identically every time,
   * so retrying only delays the error the user needs to see.
   */
  get isRetryable(): boolean {
    return this.status >= 500 || this.status === 429;
  }
}

/** The request never reached the server. */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super('Network request failed');
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

/** The request exceeded the configured timeout. */
export class TimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}
