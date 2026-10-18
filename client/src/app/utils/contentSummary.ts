import type { ContentSummaryResponse } from "@app/client";

/**
 * A repository version's `content_summary` buckets (`added`/`removed`/`present`)
 * are objects keyed by content pulp_type, each value carrying a `count` and an
 * `href` to the filtered content list. The generated type models the inner value
 * loosely (`{ [key: string]: unknown }`), so these helpers read `count`/`href`
 * defensively.
 */
type SummaryBucket = ContentSummaryResponse["present"] | undefined;

export interface IContentTypeCount {
  pulpType: string;
  count: number;
  href?: string;
}

/** Per-content-type counts (+ drill-down href) for one summary bucket. */
export const summaryEntries = (bucket: SummaryBucket): IContentTypeCount[] => {
  if (!bucket) return [];
  return Object.entries(bucket).map(([pulpType, value]) => {
    const record = value as { count?: number; href?: string };
    return {
      pulpType,
      count: typeof record?.count === "number" ? record.count : 0,
      href: typeof record?.href === "string" ? record.href : undefined,
    };
  });
};

/** Total unit count across all content types in a summary bucket. */
export const summaryTotal = (bucket: SummaryBucket): number =>
  summaryEntries(bucket).reduce((sum, entry) => sum + entry.count, 0);
