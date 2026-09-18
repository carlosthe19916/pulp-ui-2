import type React from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  Pagination,
  PaginationVariant,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  type DataViewTr,
  useDataViewPagination,
} from "@patternfly/react-data-view";

import type {
  FileFileRepositoryResponse,
  MultipleArtifactContentResponse,
} from "@app/client";
import { dataViewBodyStates } from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { UploadModal } from "@app/components/UploadModal";
import type { getDescriptor } from "@app/descriptors/registry";
import type { WithId } from "@app/models/models";
import { useContentListQuery } from "@app/queries/content";
import { useFileRepositoryVersionsListQuery } from "@app/queries/file-repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

type ContentRow = MultipleArtifactContentResponse & {
  relative_path?: string;
  sha256?: string;
};

interface IRepositoryContentTabProps {
  repo: WithId<FileFileRepositoryResponse>;
  descriptor: ReturnType<typeof getDescriptor>;
}

export const RepositoryContentTab: React.FC<IRepositoryContentTabProps> = ({
  repo,
  descriptor,
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });

  const { data: versionsData } = useFileRepositoryVersionsListQuery(repo.id, {
    limit: 1,
  });
  const latestVersionHref = versionsData?.results?.[0]?.pulp_href ?? undefined;

  const {
    data: contentData,
    isLoading: isContentLoading,
    error: contentError,
  } = useContentListQuery(
    {
      repository_version: latestVersionHref,
      limit: perPage,
      offset: (page - 1) * perPage,
    },
    { enabled: !!latestVersionHref },
  );

  const contentUnits = (contentData?.results ?? []) as ContentRow[];
  const totalCount = contentData?.count ?? 0;

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
    columnCount: contentColumns.length,
    isLoading: isContentLoading,
    error: contentError,
    isEmpty: contentUnits.length === 0,
    emptyState: (
      <TableEmptyState
        title="No content found"
        body="There is no content in the latest version."
      />
    ),
  });

  const pagination = (variant: PaginationVariant) => (
    <Pagination
      variant={variant}
      itemCount={totalCount}
      page={page}
      perPage={perPage}
      onSetPage={onSetPage}
      onPerPageSelect={onPerPageSelect}
    />
  );

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
              <DataViewToolbar pagination={pagination(PaginationVariant.top)} />
              <DataViewTable
                aria-label="Repository content table"
                columns={contentColumns}
                rows={contentRows}
                bodyStates={repoContentStates.bodyStates}
              />
              <DataViewToolbar
                pagination={pagination(PaginationVariant.bottom)}
              />
            </DataView>
          )}
        </StackItem>
      </Stack>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        repositoryHref={repo.object.pulp_href ?? ""}
      />
    </>
  );
};
