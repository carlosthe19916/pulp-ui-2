import type React from "react";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  List,
  ListItem,
} from "@patternfly/react-core";

import type { PublicationResponse } from "@app/client";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { formatDateTime } from "@app/utils/utils";

interface IPublicationDetailPanelProps {
  publication: PublicationResponse;
}

/**
 * Expanded-row detail for a publication: the repository/version it was built from
 * and the distributions currently serving it (`distributions[]` is plugin-specific
 * and only present on typed payloads).
 */
export const PublicationDetailPanel: React.FC<IPublicationDetailPanelProps> = ({
  publication,
}) => {
  const record = publication as Record<string, unknown>;
  const distributions = Array.isArray(record.distributions)
    ? (record.distributions as string[])
    : [];

  return (
    <DescriptionList isCompact>
      <DescriptionListGroup>
        <DescriptionListTerm>Repository</DescriptionListTerm>
        <DescriptionListDescription>
          <ResourceHrefLink kind="repository" href={publication.repository} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Repository version</DescriptionListTerm>
        <DescriptionListDescription>
          {publication.repository_version || "—"}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Distributions</DescriptionListTerm>
        <DescriptionListDescription>
          {distributions.length > 0 ? (
            <List isPlain>
              {distributions.map((href) => (
                <ListItem key={href}>{href}</ListItem>
              ))}
            </List>
          ) : (
            "—"
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Created</DescriptionListTerm>
        <DescriptionListDescription>
          {formatDateTime(publication.pulp_created) ?? "—"}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>PRN</DescriptionListTerm>
        <DescriptionListDescription>
          {publication.prn ?? "—"}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};
