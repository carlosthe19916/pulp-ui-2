import type { ContentSummaryResponse } from "@app/client";
import { summaryEntries } from "@app/utils/contentSummary";
import type { IBrowseSection } from "@plugin-sdk/ui";

/** Sections whose content types are present in the version, each with its summed count. */
export const visibleSections = ({
  sections,
  summary,
}: {
  sections: readonly IBrowseSection[];
  summary?: ContentSummaryResponse;
}): { section: IBrowseSection; count: number }[] => {
  const counts = new Map(
    summaryEntries(summary?.present).map((entry) => [
      entry.pulpType,
      entry.count,
    ]),
  );
  return sections
    .map((section) => ({
      section,
      count: section.pulpTypes.reduce(
        (total, pulpType) => total + (counts.get(pulpType) ?? 0),
        0,
      ),
    }))
    .filter(({ count }) => count > 0);
};
