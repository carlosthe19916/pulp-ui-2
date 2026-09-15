import type React from "react";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";

import type { FileFileRepositoryResponse } from "@app/client";
import { DescriptorDetailFields } from "@app/components/DescriptorDetailFields";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import type { getDescriptor } from "@app/descriptors/registry";
import { formatDateTime } from "@app/utils/utils";

interface IRepositoryDetailsTabProps {
  repo: FileFileRepositoryResponse;
  descriptor: ReturnType<typeof getDescriptor>;
}

export const RepositoryDetailsTab: React.FC<IRepositoryDetailsTabProps> = ({
  repo,
  descriptor,
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
    <DescriptorDetailFields
      fields={descriptor?.detailFields}
      entity={repo}
      skipKeys={["remote"]}
    />
  </DescriptionList>
);
