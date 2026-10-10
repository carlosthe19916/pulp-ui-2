import type React from "react";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";

import type { IEntityPlugin } from "@catalog";
import type { FileFileRepositoryResponse } from "@app/client";
import { EntityDetailFields } from "@app/components/EntityDetailFields";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { formatDateTime } from "@app/utils/utils";

interface IRepositoryDetailsTabProps {
  repo: FileFileRepositoryResponse;
  plugin: IEntityPlugin | undefined;
}

export const RepositoryDetailsTab: React.FC<IRepositoryDetailsTabProps> = ({
  repo,
  plugin,
}) => (
  <DescriptionList isHorizontal>
    <DescriptionListGroup>
      <DescriptionListTerm>Name</DescriptionListTerm>
      <DescriptionListDescription>
        {repo.name ?? "Repository"}
      </DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Description</DescriptionListTerm>
      <DescriptionListDescription>
        {repo.description || "—"}
      </DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Remote</DescriptionListTerm>
      <DescriptionListDescription>
        <ResourceHrefLink kind="remote" href={repo.remote} />
      </DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Retain repo versions</DescriptionListTerm>
      <DescriptionListDescription>
        {repo.retain_repo_versions ?? "All"}
      </DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Created</DescriptionListTerm>
      <DescriptionListDescription>
        {formatDateTime(repo.pulp_created) ?? "—"}
      </DescriptionListDescription>
    </DescriptionListGroup>
    <EntityDetailFields
      fields={plugin?.page.detailFields}
      entity={repo}
      skipKeys={["remote", "description", "retain_repo_versions"]}
    />
  </DescriptionList>
);
