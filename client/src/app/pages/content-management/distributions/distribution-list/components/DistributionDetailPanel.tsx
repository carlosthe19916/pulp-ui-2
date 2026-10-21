import type React from "react";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";

import type { DistributionResponse } from "@app/client";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { formatDateTime } from "@app/utils/utils";

interface IDistributionDetailPanelProps {
  distribution: DistributionResponse;
}

/**
 * Expanded-row detail for a distribution: the fields the list columns omit —
 * serving URL, content guard, what it serves (repository / version / publication)
 * and metadata. `publication` is plugin-specific (file distributions) and only
 * shown when the payload includes it.
 */
export const DistributionDetailPanel: React.FC<
  IDistributionDetailPanelProps
> = ({ distribution }) => {
  const record = distribution as Record<string, unknown>;
  const publication =
    typeof record.publication === "string" ? record.publication : null;

  return (
    <DescriptionList isCompact>
      <DescriptionListGroup>
        <DescriptionListTerm>Base URL</DescriptionListTerm>
        <DescriptionListDescription>
          {distribution.base_url || "—"}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Content guard</DescriptionListTerm>
        <DescriptionListDescription>
          {distribution.content_guard || "—"}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Repository</DescriptionListTerm>
        <DescriptionListDescription>
          <ResourceHrefLink kind="repository" href={distribution.repository} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Repository version</DescriptionListTerm>
        <DescriptionListDescription>
          {distribution.repository_version || "—"}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Publication</DescriptionListTerm>
        <DescriptionListDescription>
          {publication || "—"}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Hidden</DescriptionListTerm>
        <DescriptionListDescription>
          {distribution.hidden ? "Yes" : "No"}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Created</DescriptionListTerm>
        <DescriptionListDescription>
          {formatDateTime(distribution.pulp_created) ?? "—"}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>PRN</DescriptionListTerm>
        <DescriptionListDescription>
          {distribution.prn ?? "—"}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};
