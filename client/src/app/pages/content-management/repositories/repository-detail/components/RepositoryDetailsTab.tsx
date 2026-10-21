import type React from "react";

import { Link } from "@tanstack/react-router";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import { getPlugin } from "@catalog";
import type { RepositoryResponse } from "@app/client";
import { EntityDetailFields } from "@app/components/EntityDetailFields";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { formatDateTime } from "@app/utils/utils";

interface IRepositoryDetailsTabProps {
  repository: RepositoryResponse;
  pulpType: string;
  pulpDomain: string;
}

// Two columns from md up, one on narrow screens.
const COLUMNS = { default: "1Col", md: "2Col" } as const;

export const RepositoryDetailsTab: React.FC<IRepositoryDetailsTabProps> = ({
  repository,
  pulpType,
  pulpDomain,
}) => {
  const fields =
    getPlugin(pulpType)?.entities.repository?.form.editFields ?? [];
  const latestHref = repository.latest_version_href;
  const latestNumber = latestHref ? extractIdFromHref(latestHref) : undefined;

  return (
    <Stack hasGutter>
      <StackItem>
        <EntityDetailFields
          fields={fields}
          data={repository as Record<string, unknown>}
          columnModifier={COLUMNS}
        />
      </StackItem>
      <StackItem>
        <DescriptionList columnModifier={COLUMNS}>
          <DescriptionListGroup>
            <DescriptionListTerm>Type</DescriptionListTerm>
            <DescriptionListDescription>
              <PulpTypeLabel pulpType={pulpType} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Latest version</DescriptionListTerm>
            <DescriptionListDescription>
              {latestNumber != null ? (
                <Link
                  to="/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/versions/$versionNumber"
                  params={{
                    pulpDomain,
                    repositoryType: pulpType,
                    repositoryId: extractIdFromHref(repository.pulp_href ?? ""),
                    versionNumber: latestNumber,
                  }}
                >
                  Version {latestNumber}
                </Link>
              ) : (
                "—"
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Created</DescriptionListTerm>
            <DescriptionListDescription>
              {formatDateTime(repository.pulp_created) ?? "—"}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Last updated</DescriptionListTerm>
            <DescriptionListDescription>
              {formatDateTime(repository.pulp_last_updated) ?? "—"}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>PRN</DescriptionListTerm>
            <DescriptionListDescription>
              {repository.prn ?? "—"}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
    </Stack>
  );
};
