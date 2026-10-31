import type React from "react";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
} from "@patternfly/react-core";

import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { useMavenPathIndexStatusQuery } from "@app/queries/maven-repositories";
import type { IRepositoryTabProps } from "@plugin-sdk/ui";

/** The state of a Maven repository's path index (build it from the actions menu). */
export const MavenPathIndexTab: React.FC<IRepositoryTabProps> = ({
  repository,
}) => {
  const { data, isLoading, error } = useMavenPathIndexStatusQuery({
    repositoryHref: repository.pulp_href ?? "",
  });

  return (
    <LoadingWrapper isFetching={isLoading} fetchError={error}>
      <DescriptionList isHorizontal>
        <DescriptionListGroup>
          <DescriptionListTerm>Enabled</DescriptionListTerm>
          <DescriptionListDescription>
            {data?.enabled ? "Yes" : "No"}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Status</DescriptionListTerm>
          <DescriptionListDescription>
            {data?.ready ? (
              <Label color="green">Ready</Label>
            ) : (
              <Label color="grey">Not ready</Label>
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Indexed version</DescriptionListTerm>
          <DescriptionListDescription>
            {data?.latest_version ?? "—"}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Manifest digest</DescriptionListTerm>
          <DescriptionListDescription>
            {data?.manifest_digest ?? "—"}
          </DescriptionListDescription>
        </DescriptionListGroup>
        {data?.error ? (
          <DescriptionListGroup>
            <DescriptionListTerm>Error</DescriptionListTerm>
            <DescriptionListDescription>
              {data.error}
            </DescriptionListDescription>
          </DescriptionListGroup>
        ) : null}
      </DescriptionList>
    </LoadingWrapper>
  );
};
