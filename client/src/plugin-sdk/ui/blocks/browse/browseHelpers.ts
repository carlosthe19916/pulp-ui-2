/** Which rows start a new group (e.g. one package name above its versions). */
export const groupStarts = <T>({
  rows,
  groupBy,
}: {
  rows: T[];
  groupBy: (row: T) => string;
}): boolean[] =>
  rows.map(
    (row, index) => index === 0 || groupBy(rows[index - 1]) !== groupBy(row),
  );

/** `a/b/` → `["a", "b"]`; the prefix of segment i is `segments.slice(0, i + 1).join("/") + "/"`. */
export const pathSegments = (prefix: string): string[] =>
  prefix.split("/").filter(Boolean);
