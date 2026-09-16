/** Minimal shape of a Pulp paginated list response. */
interface IPaginatedLike<T> {
  count: number;
  next?: string | null;
  results: T[];
}

/**
 * Fetch every page of a Pulp paginated endpoint by walking `offset`. Use only when
 * the endpoint can't do the paging/sorting/filtering the UI needs — never guess a limit.
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
