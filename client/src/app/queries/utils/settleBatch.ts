/** Outcome of a batch of independent requests, by item label. */
export interface IBatchResult {
  succeeded: string[];
  /** Each failed item with the request's rejection, for an error message. */
  failed: { label: string; error: unknown }[];
}

/**
 * Run one request per item in parallel and split the items by outcome, so a
 * partial failure still reports what went through and why the rest didn't.
 *
 * @example
 * settleBatch({ items: users, label: (u) => u.username, request: (u) => post(u) })
 * // { succeeded: ["alice"], failed: [{ label: "bob", error: AxiosError }] }
 */
export const settleBatch = async <T>({
  items,
  label,
  request,
}: {
  items: T[];
  label: (item: T) => string;
  request: (item: T) => Promise<unknown>;
}): Promise<IBatchResult> => {
  const results = await Promise.allSettled(items.map(request));
  const result: IBatchResult = { succeeded: [], failed: [] };
  results.forEach((outcome, i) => {
    if (outcome.status === "fulfilled") {
      result.succeeded.push(label(items[i]));
    } else {
      result.failed.push({ label: label(items[i]), error: outcome.reason });
    }
  });
  return result;
};
