/** About 3k tokens of Pulp data per read; the card shows the full page. */
const MAX_CHARS = 12_000;
const MAX_STRING = 300;
const MAX_ITEMS = 25;
const MAX_DEPTH = 4;

const shorten = (value: unknown, depth: number): unknown => {
  if (typeof value === "string") {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  }
  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ITEMS)
      .map((item) => shorten(item, depth + 1));
    return value.length > MAX_ITEMS
      ? [...items, `…${value.length - MAX_ITEMS} more`]
      : items;
  }
  if (typeof value === "object" && value !== null) {
    if (depth >= MAX_DEPTH) return "{…}";
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        shorten(item, depth + 1),
      ]),
    );
  }
  return value;
};

/** What the model gets of a response: long strings cut, and rows dropped to fit the budget. */
export const trimForModel = (data: unknown): unknown => {
  // A page's rows are kept whole and dropped from the end below, not capped like other lists.
  const short =
    typeof data === "object" &&
    data !== null &&
    "results" in data &&
    Array.isArray(data.results)
      ? {
          ...(shorten({ ...data, results: [] }, 0) as object),
          results: data.results.map((row: unknown) => shorten(row, 1)),
        }
      : shorten(data, 0);
  if (JSON.stringify(short).length <= MAX_CHARS) return short;
  if (typeof short === "object" && short !== null && "results" in short) {
    const page = short as { results: unknown[] };
    const rows = [...page.results];
    let omitted = 0;
    while (
      rows.length > 1 &&
      JSON.stringify({ ...page, results: rows, omittedRowsToFit: omitted })
        .length > MAX_CHARS
    ) {
      rows.pop();
      omitted += 1;
    }
    return { ...page, results: rows, omittedRowsToFit: omitted };
  }
  return `${JSON.stringify(short).slice(0, MAX_CHARS)}… (cut; ask for fewer fields)`;
};
