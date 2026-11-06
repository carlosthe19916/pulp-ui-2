/** The pip command that installs from this index. */
export const pipInstall = (baseUrl: string) =>
  `pip install --index-url ${baseUrl}simple/ <package>`;

/** Pulp returns a package's JSON metadata fields as JSON-encoded strings. */
export const parseJsonField = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
};

/** `Project-URL` metadata (`["Label, url", ...]`, or a `{ label: url }` object) by label. */
export const projectUrls = (value: unknown): Record<string, unknown> => {
  const parsed = parseJsonField(value);
  if (Array.isArray(parsed)) {
    return Object.fromEntries(
      parsed.flatMap((entry) => {
        if (typeof entry !== "string" || !entry.includes(",")) {
          return [];
        }
        const comma = entry.indexOf(",");
        return [[entry.slice(0, comma).trim(), entry.slice(comma + 1).trim()]];
      }),
    );
  }
  return parsed && typeof parsed === "object"
    ? (parsed as Record<string, unknown>)
    : {};
};
