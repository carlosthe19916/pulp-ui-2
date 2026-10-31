import type React from "react";
import { lazy, Suspense } from "react";

import { useNavigate } from "@tanstack/react-router";

import {
  Alert,
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import type { RepositoryResponse } from "@app/client";
import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  extractIdFromHref,
  parseRepositoryVersionHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";

import {
  buildRepositoryGraph,
  type ITopologyNodeData,
} from "./buildRepositoryGraph";
import { useRepositoryGraphData } from "./useRepositoryGraphData";

// d3, mobx and dagre load only when the tab opens.
const RepositoryTopologyView = lazy(async () => ({
  default: (await import("./RepositoryTopologyView")).RepositoryTopologyView,
}));

const PINNED_NOTE =
  "Distributions pinned to a specific version aren't shown: Pulp can't look them up by repository.";

interface IRepositoryTopologyTabProps {
  repository: RepositoryResponse;
  pulpType: string;
  isRunning: boolean;
  /** Publications and distributions have no page: their tab lists them. */
  onOpenTab: (tab: "publications" | "distributions") => void;
}

/** Where the repository's content comes from and how it is served, as a graph. */
export const RepositoryTopologyTab: React.FC<IRepositoryTopologyTabProps> = ({
  repository,
  pulpType,
  isRunning,
  onOpenTab,
}) => {
  const navigate = useNavigate();
  const { name: pulpDomain } = useSelectedDomain();
  const { isLoading, error, ...data } = useRepositoryGraphData({
    repository,
    pulpType,
  });
  const { nodes, edges, isServed, isTrivial } = buildRepositoryGraph({
    repository,
    ...data,
    isRunning,
  });

  const onNodeSelect = ({ kind, href }: ITopologyNodeData) => {
    switch (kind) {
      case "publication":
      case "distribution":
        onOpenTab(`${kind}s`);
        return;
      case "remote": {
        const remoteType = resolvePulpType(href);
        if (!remoteType) return;
        void navigate({
          to: "/content-management/$pulpDomain/remotes/$remoteType/$remoteId",
          params: { pulpDomain, remoteType, remoteId: extractIdFromHref(href) },
        });
        return;
      }
      case "version": {
        const version = parseRepositoryVersionHref(href);
        if (!version) return;
        void navigate({
          to: "/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/versions/$versionNumber",
          params: {
            pulpDomain,
            repositoryType: pulpType,
            repositoryId: extractIdFromHref(version.repositoryHref),
            versionNumber: version.number,
          },
        });
        return;
      }
      case "repository":
        return;
    }
  };

  return (
    <LoadingWrapper isFetching={isLoading} fetchError={error}>
      {isTrivial ? (
        <EmptyState titleText="Not served" headingLevel="h4" variant="sm">
          <EmptyStateBody>
            No distribution serves this repository, and it has no remote or
            publications. {PINNED_NOTE}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Stack hasGutter>
          <StackItem>
            <Alert
              variant="info"
              isInline
              isPlain
              title={
                isServed
                  ? PINNED_NOTE
                  : `Not served: no distribution serves this repository or the publications shown. ${PINNED_NOTE}`
              }
            />
          </StackItem>
          <StackItem>
            <div style={{ height: "32rem" }}>
              <Suspense
                fallback={
                  <Bullseye>
                    <Spinner />
                  </Bullseye>
                }
              >
                <RepositoryTopologyView
                  nodes={nodes}
                  edges={edges}
                  onNodeSelect={onNodeSelect}
                />
              </Suspense>
            </div>
          </StackItem>
        </Stack>
      )}
    </LoadingWrapper>
  );
};
