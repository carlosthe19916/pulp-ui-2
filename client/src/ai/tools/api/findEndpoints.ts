import { ENDPOINT_INDEX } from "./endpointIndex.gen";

const MAX_MATCHES = 12;
const MAX_FILTERS = 40;

const tokens = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);

export interface IEndpointMatch {
  path: string;
  summary: string;
  filters: string;
}

/** The endpoints whose path, summary or filters best match the words of `query`. */
export const findEndpoints = (query: string): IEndpointMatch[] => {
  const words = tokens(query);
  return ENDPOINT_INDEX.map(([path, summary, filters]) => {
    const pathWords = tokens(path);
    const summaryWords = tokens(summary);
    const filterWords = tokens(filters);
    const score = words.reduce(
      (total, word) =>
        total +
        (pathWords.some((token) => token.startsWith(word)) ? 3 : 0) +
        (summaryWords.some((token) => token.startsWith(word)) ? 2 : 0) +
        (filterWords.includes(word) ? 1 : 0),
      0,
    );
    return { path, summary, filters, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATCHES)
    .map(({ path, summary, filters }) => ({
      path,
      summary,
      filters: filters.split(" ").slice(0, MAX_FILTERS).join(" "),
    }));
};
