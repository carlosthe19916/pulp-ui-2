import type React from "react";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  LabelGroup,
} from "@patternfly/react-core";

import { getPlugin } from "@catalog";
import type { ContentSummaryResponse } from "@app/client";
import {
  summaryEntries,
  type IContentTypeCount,
} from "@app/utils/contentSummary";

const BucketLabels: React.FC<{ entries: IContentTypeCount[] }> = ({
  entries,
}) => {
  if (entries.length === 0) return <>—</>;
  return (
    <LabelGroup numLabels={10}>
      {entries.map((entry) => (
        <Label key={entry.pulpType} color="blue" isCompact>
          {getPlugin(entry.pulpType)?.label ?? entry.pulpType}: {entry.count}
        </Label>
      ))}
    </LabelGroup>
  );
};

/**
 * Per-content-type breakdown of a repository version's `content_summary`
 * (present / added / removed), with each type rendered as a labelled chip.
 */
export const VersionContentSummary: React.FC<{
  summary?: ContentSummaryResponse;
}> = ({ summary }) => (
  <DescriptionList isHorizontal>
    <DescriptionListGroup>
      <DescriptionListTerm>Present</DescriptionListTerm>
      <DescriptionListDescription>
        <BucketLabels entries={summaryEntries(summary?.present)} />
      </DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Added</DescriptionListTerm>
      <DescriptionListDescription>
        <BucketLabels entries={summaryEntries(summary?.added)} />
      </DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Removed</DescriptionListTerm>
      <DescriptionListDescription>
        <BucketLabels entries={summaryEntries(summary?.removed)} />
      </DescriptionListDescription>
    </DescriptionListGroup>
  </DescriptionList>
);
