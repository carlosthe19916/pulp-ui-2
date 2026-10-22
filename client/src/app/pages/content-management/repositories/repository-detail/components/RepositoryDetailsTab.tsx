import type React from "react";

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";

import type { RepositoryResponse } from "@app/client";
import { VersionContent } from "@app/components/VersionContent";
import { useRepositoryVersionDetailQuery } from "@app/queries/repositories";

import { RepositoryAbout } from "./RepositoryAbout";
import { RepositoryUsage } from "./RepositoryUsage";

interface IRepositoryDetailsTabProps {
  repository: RepositoryResponse;
  pulpType: string;
  pulpDomain: string;
  onViewDistributions: () => void;
}

const TitledCard: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <Card isCompact>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardBody>{children}</CardBody>
  </Card>
);

/** Overview, client setup, and the latest version's content. */
export const RepositoryDetailsTab: React.FC<IRepositoryDetailsTabProps> = ({
  repository,
  pulpType,
  pulpDomain,
  onViewDistributions,
}) => {
  const { data: latestVersion } = useRepositoryVersionDetailQuery({
    href: repository.latest_version_href ?? null,
  });

  return (
    <Stack hasGutter>
      <StackItem>
        <TitledCard title="About">
          <RepositoryAbout
            repository={repository}
            latestVersion={latestVersion}
            pulpType={pulpType}
            pulpDomain={pulpDomain}
          />
        </TitledCard>
      </StackItem>

      <StackItem>
        <TitledCard title="Use this repository">
          <RepositoryUsage
            repositoryHref={repository.pulp_href ?? ""}
            pulpType={pulpType}
            onViewDistributions={onViewDistributions}
          />
        </TitledCard>
      </StackItem>

      {latestVersion?.pulp_href && (
        <StackItem>
          <Stack hasGutter>
            <Title headingLevel="h2" size="lg">
              Latest version content
            </Title>
            <VersionContent
              versionHref={latestVersion.pulp_href}
              summary={latestVersion.content_summary}
            />
          </Stack>
        </StackItem>
      )}
    </Stack>
  );
};
