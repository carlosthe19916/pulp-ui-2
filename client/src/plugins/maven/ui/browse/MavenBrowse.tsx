import type React from "react";
import { useState } from "react";

import {
  Content,
  ContentVariants,
  Label,
  LabelGroup,
} from "@patternfly/react-core";

import type { MavenRepositoryPackageResponse } from "@app/client";
import {
  BrowseTable,
  defineBrowseListState,
  useBrowseListState,
} from "@app/components/BrowseShell";
import { formatDateTime } from "@app/utils/utils";
import type { IBrowseContext } from "@plugin-sdk/ui";

import {
  useMavenMetricsQuery,
  useMavenPackageHrefLookup,
  useMavenPackagesListQuery,
} from "../queries/maven-repositories";
import { snapshotBuild } from "./helpers";

const MAX_VERSION_LABELS = 5;

const artifactKey = ({
  group_id,
  artifact_id,
}: MavenRepositoryPackageResponse) => `${group_id}:${artifact_id}`;

const MAVEN_ARTIFACTS_LIST = defineBrowseListState({
  sort: {
    columnKeys: ["group_id", "artifact_id", "last_updated"],
    defaultValue: { sortBy: "group_id", direction: "asc" },
  },
  filters: [
    {
      param: "search",
      label: "Artifact",
      placeholder: "group or group:artifact",
    },
  ],
});

/** Maven Central style: one row per groupId:artifactId with its versions, newest first. */
export const MavenArtifacts: React.FC<IBrowseContext> = ({
  versionHref,
  repositoryHref,
  selectedHref,
  onSelect,
}) => {
  const lookupPackageHref = useMavenPackageHrefLookup();
  // The artifact whose version is open in the drawer, for the row highlight.
  const [openedArtifact, setOpenedArtifact] = useState<string | null>(null);
  const list = useBrowseListState(MAVEN_ARTIFACTS_LIST);
  const packages = useMavenPackagesListQuery({
    repositoryHref,
    params: { ...list.params, repository_version: versionHref },
  });
  const metrics = useMavenMetricsQuery({
    repositoryHref,
    params: { repository_version: versionHref },
  });

  // packages/ rows aren't content; a row (its latest version) or a version label opens
  // that version's MavenPackage in the drawer.
  const openVersion = async ({
    row,
    version,
  }: {
    row: MavenRepositoryPackageResponse;
    version: string;
  }) => {
    const href = await lookupPackageHref({
      repository_version: versionHref,
      group_id: row.group_id,
      artifact_id: row.artifact_id,
      version,
    });
    if (href) {
      setOpenedArtifact(artifactKey(row));
      onSelect(href);
    }
  };

  const counts = metrics.data;

  return (
    <BrowseTable
      ariaLabel="Artifacts"
      list={list}
      rows={packages.data?.results ?? []}
      count={packages.data?.count}
      isLoading={packages.isLoading}
      error={packages.error}
      emptyTitle="No artifacts"
      header={
        counts ? (
          <Content component={ContentVariants.small}>
            {counts.package_count.toLocaleString()} packages ·{" "}
            {counts.version_count.toLocaleString()} versions ·{" "}
            {counts.build_count.toLocaleString()} builds
          </Content>
        ) : undefined
      }
      onSelect={onSelect}
      onRowClick={(row) => {
        const version = row.latest_releases[0]?.version ?? row.versions[0];
        if (version) void openVersion({ row, version });
      }}
      isRowSelected={(row) =>
        !!selectedHref && openedArtifact === artifactKey(row)
      }
      columns={[
        {
          title: "Artifact",
          sort: list.sortProps("artifact_id"),
          width: 30,
          cell: (row) => (
            <>
              {row.artifact_id}
              <Content component={ContentVariants.small}>
                {row.group_id}
              </Content>
            </>
          ),
        },
        {
          title: "Latest",
          width: 15,
          cell: (row) => {
            const latest = row.latest_releases[0];
            const build = latest ? snapshotBuild(latest) : "";
            return latest ? (
              <>
                {latest.version}
                {build ? (
                  <Content component={ContentVariants.small}>
                    build {build}
                  </Content>
                ) : null}
              </>
            ) : (
              "—"
            );
          },
        },
        {
          title: "Versions",
          width: 35,
          cell: (row) => (
            <LabelGroup numLabels={MAX_VERSION_LABELS}>
              {row.versions.map((version) => (
                <Label
                  key={version}
                  isCompact
                  variant="outline"
                  onClick={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    void openVersion({ row, version });
                  }}
                >
                  {version}
                </Label>
              ))}
            </LabelGroup>
          ),
        },
        {
          title: "Updated",
          sort: list.sortProps("last_updated"),
          width: 20,
          cell: (row) => formatDateTime(row.last_updated) ?? "—",
        },
      ]}
    />
  );
};
