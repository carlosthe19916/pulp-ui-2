/** Minimal shape of a Pulp paginated list response. */
interface IPaginatedLike<T> {
  count: number;
  next?: string | null;
  results: T[];
}

/**
 * Fetch every page of a Pulp paginated endpoint by walking `offset` until the
 * response is exhausted. Use this only as a fallback for the cases where the
 * endpoint cannot do the pagination/sorting/filtering the UI needs (e.g. a
 * client-side dual-list, or a `limit`/`offset`-only nested endpoint) — never
 * fetch a hardcoded guessed limit.
 *
 * The paginated response tells us when to stop: `next` is null on the last
 * page, and `count` bounds the total.
 */
export async function fetchAllPages<T>(
  fetchPage: (offset: number, limit: number) => Promise<IPaginatedLike<T>>,
  pageSize = 100,
): Promise<{ results: T[]; count: number }> {
  const results: T[] = [];
  let offset = 0;
  let count: number;
  for (;;) {
    const page = await fetchPage(offset, pageSize);
    count = page.count;
    results.push(...page.results);
    if (
      !page.next ||
      page.results.length === 0 ||
      results.length >= page.count
    ) {
      break;
    }
    offset += page.results.length;
  }
  return { results, count };
}
