import type React from "react";

import { Stack, StackItem } from "@patternfly/react-core";

import type {
  RepositoryResponse,
  RepositoryVersionResponse,
} from "@app/client";
import { DetailSectionCard } from "@app/components/DetailSectionCard";

import { RepositoryAbout } from "./RepositoryAbout";
import { RepositoryUsage } from "./RepositoryUsage";

interface IRepositoryDetailsTabProps {
  repository: RepositoryResponse;
  latestVersion?: RepositoryVersionResponse;
  pulpType: string;
  pulpDomain: string;
  onViewContent: () => void;
  onViewDistributions: () => void;
}

/** Overview and client setup; the content itself has its own tab. */
export const RepositoryDetailsTab: React.FC<IRepositoryDetailsTabProps> = ({
  repository,
  latestVersion,
  pulpType,
  pulpDomain,
  onViewContent,
  onViewDistributions,
}) => (
  <Stack hasGutter>
    <StackItem>
      <DetailSectionCard id="metadata" title="About">
        <RepositoryAbout
          repository={repository}
          latestVersion={latestVersion}
          pulpType={pulpType}
          pulpDomain={pulpDomain}
          onViewContent={onViewContent}
        />
      </DetailSectionCard>
    </StackItem>

    <StackItem>
      <DetailSectionCard id="serving" title="Use this repository">
        <RepositoryUsage
          repositoryHref={repository.pulp_href ?? ""}
          onViewDistributions={onViewDistributions}
        />
      </DetailSectionCard>
    </StackItem>
  </Stack>
);
