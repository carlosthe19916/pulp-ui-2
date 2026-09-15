import type React from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { MultipleArtifactContentResponse } from "@app/client";
import { dataViewBodyStates } from "@app/components/DataView";
import { UploadModal } from "@app/components/UploadModal";
import type { getDescriptor } from "@app/descriptors/registry";
import { useContentListQuery } from "@app/queries/content";
import { useFileRepositoryVersionsListQuery } from "@app/queries/file-repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

type ContentRow = MultipleArtifactContentResponse & {
  relative_path?: string;
  sha256?: string;
};

interface IRepositoryContentTabProps {
  repoId: string;
  repoHref: string;
  descriptor: ReturnType<typeof getDescriptor>;
}

export const RepositoryContentTab: React.FC<IRepositoryContentTabProps> = ({
  repoId,
  repoHref,
  descriptor,
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data: versionsData } = useFileRepositoryVersionsListQuery(repoId);
  const latestVersionHref = versionsData?.results?.[0]?.pulp_href ?? undefined;

  const { data: contentData, isLoading: isContentLoading } =
    useContentListQuery(
      {
        repository_version: latestVersionHref,
        limit: 50,
      },
      { enabled: !!latestVersionHref },
    );

  const contentUnits = (contentData?.results ?? []) as ContentRow[];

  const contentColumns = ["Path", "SHA256"];

  const contentRows: DataViewTr[] = contentUnits.map((unit) => {
    const href = unit.pulp_href;
    const label = unit.relative_path ?? "—";
    const sha = unit.sha256;
    return {
      id: href,
      row: [
        {
          cell: href ? (
            <Link
              to="/content-management/content/$contentId"
              params={{ contentId: extractIdFromHref(href) }}
            >
              {label}
            </Link>
          ) : (
            label
          ),
          props: { dataLabel: "Path" },
        },
        {
          cell: !sha ? "—" : sha.length > 20 ? `${sha.slice(0, 20)}...` : sha,
          props: { dataLabel: "SHA256" },
        },
      ],
    };
  });

  const repoContentStates = dataViewBodyStates({
    loading: isContentLoading,
    empty: contentUnits.length === 0,
    emptyState: "No content in the latest version.",
  });

  return (
    <>
      <Stack hasGutter>
        <StackItem>
          {descriptor?.supportsUpload !== false && (
            <Button variant="secondary" onClick={() => setIsUploadOpen(true)}>
              Upload content
            </Button>
          )}
        </StackItem>
        <StackItem>
          {!latestVersionHref ? (
            <Content component={ContentVariants.p}>
              No repository version yet. Sync or upload content to create one.
            </Content>
          ) : (
            <DataView activeState={repoContentStates.activeState}>
              <DataViewTable
                aria-label="Repository content table"
                columns={contentColumns}
                rows={contentRows}
                bodyStates={repoContentStates.bodyStates}
              />
            </DataView>
          )}
        </StackItem>
      </Stack>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        repositoryHref={repoHref}
      />
    </>
  );
};
