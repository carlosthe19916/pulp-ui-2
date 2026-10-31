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
} from "@patternfly/react-core";

import type {
  RepositoryResponse,
  RepositoryVersionResponse,
} from "@app/client";

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
      <TitledCard title="About">
        <RepositoryAbout
          repository={repository}
          latestVersion={latestVersion}
          pulpType={pulpType}
          pulpDomain={pulpDomain}
          onViewContent={onViewContent}
        />
      </TitledCard>
    </StackItem>

    <StackItem>
      <TitledCard title="Use this repository">
        <RepositoryUsage
          repositoryHref={repository.pulp_href ?? ""}
          onViewDistributions={onViewDistributions}
        />
      </TitledCard>
    </StackItem>
  </Stack>
);
