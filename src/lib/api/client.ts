import { ApiError, NetworkError, TimeoutError } from './errors';

export type ApiClientConfig = {
  baseUrl: string;
  timeoutMs?: number;
  /** Called per request. Return undefined to send no Authorization header. */
  getAuthToken?: () => string | undefined | Promise<string | undefined>;
  /**
   * Called per request for backends whose auth is not a bearer token — extra
   * headers merged in before the request goes out.
   *
   * Per-request rather than fixed at construction because these usually derive
   * from the live session: a hand-built `Cookie`, a tenant or workspace id, an
   * API version pinned to the signed-in user. All of them change at sign-in and
   * vanish at sign-out, so a static header map captured at construction would
   * go stale on the first login.
   *
   * Entries are applied BEFORE `getAuthToken`, so a bearer token still wins on
   * `Authorization`. Skip a header by omitting the key; `undefined` values are
   * dropped rather than sent as the string "undefined".
   */
  getHeaders?: () => Record<string, string | undefined> | Promise<Record<string, string | undefined>>;
  /** Called on any 401, before the ApiError is thrown. */
  onUnauthorized?: () => void | Promise<void>;
};

export type ApiClient = {
  get: <T>(path: string, init?: RequestInit) => Promise<T>;
  post: <T>(path: string, body?: unknown, init?: RequestInit) => Promise<T>;
  put: <T>(path: string, body?: unknown, init?: RequestInit) => Promise<T>;
  patch: <T>(path: string, body?: unknown, init?: RequestInit) => Promise<T>;
  delete: <T>(path: string, init?: RequestInit) => Promise<T>;
};

const DEFAULT_TIMEOUT_MS = 30_000;

const joinUrl = (base: string, path: string): string =>
  `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
    return undefined;
  }
  const text = await response.text();
  if (text === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Builds an API client. Deliberately unbound to any base URL, endpoint set, or
 * auth scheme — apps supply those. Only transport concerns live here: URL
 * joining, JSON encoding, timeouts, and turning failures into typed errors.
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const headers = new Headers(init?.headers);
    if (body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    // Before getAuthToken, so a bearer token still wins on Authorization.
    // Undefined values are DROPPED — sending `x-tenant-id: undefined` is worse
    // than sending nothing, because the server sees a syntactically valid
    // header carrying garbage rather than an absent one.
    const extra = await config.getHeaders?.();
    if (extra) {
      for (const [name, value] of Object.entries(extra)) {
        if (value !== undefined) headers.set(name, value);
      }
    }

    const token = await config.getAuthToken?.();
    if (token !== undefined) headers.set('Authorization', `Bearer ${token}`);

    let response: Response;
    try {
      response = await fetch(joinUrl(config.baseUrl, path), {
        ...init,
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (cause) {
      // An abort here is our own timeout firing, not a caller cancellation:
      // callers pass their own signal through `init`, which fetch surfaces
      // separately.
      if (cause instanceof Error && cause.name === 'AbortError') {
        throw new TimeoutError(timeoutMs);
      }
      throw new NetworkError(cause);
    } finally {
      clearTimeout(timer);
    }

    const parsed = await parseBody(response);

    if (!response.ok) {
      if (response.status === 401) await config.onUnauthorized?.();
      const code =
        typeof parsed === 'object' && parsed !== null && 'code' in parsed
          ? String((parsed as { code: unknown }).code)
          : `http_${response.status}`;
      throw new ApiError(response.status, code, parsed);
    }

    return parsed as T;
  }

  return {
    get: (path, init) => request('GET', path, undefined, init),
    post: (path, body, init) => request('POST', path, body, init),
    put: (path, body, init) => request('PUT', path, body, init),
    patch: (path, body, init) => request('PATCH', path, body, init),
    delete: (path, init) => request('DELETE', path, undefined, init),
  };
}
