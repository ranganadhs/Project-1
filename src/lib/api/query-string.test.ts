import { queryString } from './query-string';

describe('queryString', () => {
  /**
   * `?weekId=undefined` is worse than sending nothing: the server sees a valid
   * parameter carrying the literal string "undefined", filters on it, and
   * returns an empty list rather than an error — a bug that reads as "no data"
   * and gets investigated as a backend problem.
   */
  it('drops undefined and null rather than serialising them', () => {
    expect(queryString({ a: 1, b: undefined, c: null })).toBe('?a=1');
  });

  it('returns an empty string when nothing survives, so callers can append unconditionally', () => {
    expect(queryString({ a: undefined })).toBe('');
    expect(queryString({})).toBe('');
  });

  it('keeps falsy values that are real, since 0 and empty string are answers', () => {
    expect(queryString({ page: 0, q: '' })).toBe('?page=0&q=');
  });

  it('encodes keys and values', () => {
    expect(queryString({ q: 'a b&c' })).toBe('?q=a%20b%26c');
  });
});
