import type { ApiClient } from './client';
import { guardWrites, WritesDisabledError } from './write-guard';

/** Records what reached the underlying client, so a refusal is observable. */
function stubClient() {
  const calls: string[] = [];
  const record =
    (method: string) =>
    async <T>(path: string): Promise<T> => {
      calls.push(`${method} ${path}`);
      return undefined as T;
    };
  const client: ApiClient = {
    get: record('GET'),
    post: record('POST'),
    put: record('PUT'),
    patch: record('PATCH'),
    delete: record('DELETE'),
  };
  return { client, calls };
}

describe('guardWrites', () => {
  it('never gates reads', async () => {
    const { client, calls } = stubClient();
    await guardWrites(client, () => false).get('/things');
    expect(calls).toEqual(['GET /things']);
  });

  /**
   * Fails CLOSED and throws rather than no-opping. A silently swallowed write
   * is worse than a loud refusal: the UI would report success, the user would
   * believe it was recorded, and nothing would exist.
   */
  it.each(['post', 'put', 'patch', 'delete'] as const)(
    'refuses %s while writes are disabled, without calling through',
    async (method) => {
      const { client, calls } = stubClient();
      const guarded = guardWrites(client, () => false);
      expect(() => guarded[method]('/things')).toThrow(WritesDisabledError);
      expect(calls).toEqual([]);
    },
  );

  it('names the method and path it refused, so the log says what to enable', () => {
    const { client } = stubClient();
    expect(() => guardWrites(client, () => false).post('/attempts')).toThrow(/POST \/attempts/);
  });

  it('lets writes through once enabled', async () => {
    const { client, calls } = stubClient();
    await guardWrites(client, () => true).post('/things');
    expect(calls).toEqual(['POST /things']);
  });

  /**
   * The flag is a function, not a boolean, precisely so it can change after the
   * client is built — a debug toggle, or a test moving between cases.
   */
  it('re-reads the flag on every call rather than capturing it once', async () => {
    const { client, calls } = stubClient();
    let allowed = false;
    const guarded = guardWrites(client, () => allowed);

    expect(() => guarded.post('/first')).toThrow(WritesDisabledError);
    allowed = true;
    await guarded.post('/second');

    expect(calls).toEqual(['POST /second']);
  });
});
