import type React from "react";
import { useId, useState } from "react";

import {
  Card,
  CardBody,
  CardExpandableContent,
  CardHeader,
  CardTitle,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";

import type { RepositoryResponse } from "@app/client";
import { RepositoryContent } from "@app/components/RepositoryContent";
import { TableEmptyState } from "@app/components/TableEmptyState";
import type { IContentWrites } from "@app/hooks/useContentUnitSelection";
import { useRepositoryVersionDetailQuery } from "@app/queries/repositories";
import { summaryTotal } from "@app/utils/contentSummary";

import { RepositoryAbout } from "./RepositoryAbout";
import { RepositoryUsage } from "./RepositoryUsage";

interface IRepositoryDetailsTabProps {
  repository: RepositoryResponse;
  pulpType: string;
  pulpDomain: string;
  onViewDistributions: () => void;
  /** Content changes on the latest version; absent when the plugin can't change content. */
  writes?: IContentWrites;
}

interface ITitledCardProps {
  title: string;
  children: React.ReactNode;
}

/** A PatternFly expandable card, open by default. */
const TitledCard: React.FC<ITitledCardProps> = ({ title, children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const titleId = useId();
  return (
    <Card isCompact isExpanded={isExpanded}>
      <CardHeader
        onExpand={() => setIsExpanded((expanded) => !expanded)}
        toggleButtonProps={{
          "aria-label": title,
          "aria-labelledby": titleId,
          "aria-expanded": isExpanded,
        }}
      >
        <CardTitle id={titleId}>{title}</CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>{children}</CardBody>
      </CardExpandableContent>
    </Card>
  );
};

/** Overview, client setup, and the latest version's content. */
export const RepositoryDetailsTab: React.FC<IRepositoryDetailsTabProps> = ({
  repository,
  pulpType,
  pulpDomain,
  onViewDistributions,
  writes,
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
            {summaryTotal(latestVersion.content_summary?.present) === 0 ? (
              <TableEmptyState
                title={`No content in "${repository.name}" yet`}
              />
            ) : (
              <RepositoryContent
                // A new latest version remounts the lists, clearing their selection.
                key={latestVersion.pulp_href}
                repositoryHref={repository.pulp_href ?? ""}
                repositoryType={pulpType}
                versionHref={latestVersion.pulp_href}
                summary={latestVersion.content_summary}
                writes={writes}
              />
            )}
          </Stack>
        </StackItem>
      )}
    </Stack>
  );
};
