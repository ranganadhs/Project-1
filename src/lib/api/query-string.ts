/**
 * Builds a query string, omitting empty parameters.
 *
 * `undefined` and `null` are DROPPED rather than serialised. Sending
 * `?weekId=undefined` is worse than sending nothing: the server sees a
 * syntactically valid parameter carrying the literal string "undefined" and
 * filters on it, which returns an empty list rather than an error — the kind of
 * bug that reads as "no data" and gets investigated as a backend problem.
 *
 * Returns '' for no parameters, so callers can append unconditionally.
 */
export function queryString(params: Record<string, string | number | undefined | null>): string {
  const pairs = Object.entries(params)
    .filter(
      (entry): entry is [string, string | number] => entry[1] !== undefined && entry[1] !== null,
    )
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return pairs.length === 0 ? '' : `?${pairs.join('&')}`;
}
