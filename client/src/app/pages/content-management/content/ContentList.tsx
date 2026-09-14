import type React from "react";
import { use, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
  Pagination,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";

import type { MultipleArtifactContentResponse } from "@app/client";
import {
  DataTable,
  useDataTable,
  type AppColumnDef,
} from "@app/components/DataTable";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import {
  getDescriptor,
  getDescriptorsForKind,
} from "@app/descriptors/registry";
import { useContentListQuery } from "@app/queries/content";
import { isForbiddenError } from "@app/utils/isHttpError";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { UploadModal } from "@app/components/UploadModal";

/**
 * The aggregation endpoint returns extra fields at runtime that the generated
 * type does not include. Extend the base type for list usage.
 */
type ContentRow = MultipleArtifactContentResponse & {
  pulp_type?: string;
  relative_path?: string;
  name?: string;
  sha256?: string;
};

function truncate(value: string | null | undefined, max = 20): string {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export const ContentList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const plugins = use(ApiStatusContext)?.plugins ?? [];

  const { data, isLoading, error } = useContentListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
  });

  const content = (data?.results ?? []) as ContentRow[];
  const totalCount = data?.count ?? 0;

  const canUpload = getDescriptorsForKind("content").some(
    (d) => d.supportsUpload && d.isAvailable(plugins),
  );

  const columns = useMemo<AppColumnDef<ContentRow>[]>(
    () => [
      {
        id: "name_or_path",
        header: "Name / Path",
        cell: ({ row }) => {
          const pulpType = row.original.pulp_type;
          const descriptor = pulpType
            ? getDescriptor("content", pulpType)
            : undefined;
          const label = row.original.relative_path ?? row.original.name ?? "—";
          const href = row.original.pulp_href;
          if (!descriptor || !href) {
            return label;
          }
          const contentId = extractIdFromHref(href);
          return (
            <Link
              to="/content-management/content/$contentId"
              params={{ contentId }}
            >
              {label}
            </Link>
          );
        },
      },
      {
        id: "pulp_type",
        header: "Type",
        cell: ({ row }) => {
          const pulpType = row.original.pulp_type;
          return pulpType ? (
            <PulpTypeLabel kind="content" pulpType={pulpType} />
          ) : (
            "—"
          );
        },
      },
      {
        id: "sha256",
        header: "SHA256",
        cell: ({ row }) => truncate(row.original.sha256),
      },
    ],
    [],
  );

  const table = useDataTable({
    data: content,
    columns,
  });

  return (
    <>
      <DocumentTitle title="Content" />
      {isForbiddenError(error) ? (
        <PageSection>
          <UnauthorizedState />
        </PageSection>
      ) : (
        <PageSection>
          <Content component={ContentVariants.h1}>Content</Content>

          <Toolbar>
            <ToolbarContent>
              {canUpload && (
                <ToolbarItem>
                  <Button
                    variant="primary"
                    onClick={() => setIsUploadOpen(true)}
                  >
                    Upload content
                  </Button>
                </ToolbarItem>
              )}
              <ToolbarItem variant="pagination">
                <Pagination
                  itemCount={totalCount}
                  perPage={perPage}
                  page={page}
                  onSetPage={(_e, p) => setPage(p)}
                  onPerPageSelect={(_e, pp) => {
                    setPerPage(pp);
                    setPage(1);
                  }}
                  isCompact
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          <LoadingWrapper
            isFetching={isLoading}
            isFetchingState={<Spinner aria-label="Loading content" />}
          >
            <DataTable
              table={table}
              ariaLabel="Content table"
              isEmpty={content.length === 0}
              emptyStateContent="No content found."
            />
          </LoadingWrapper>

          <Pagination
            itemCount={totalCount}
            perPage={perPage}
            page={page}
            onSetPage={(_e, p) => setPage(p)}
            onPerPageSelect={(_e, pp) => {
              setPerPage(pp);
              setPage(1);
            }}
            variant="bottom"
          />

          <UploadModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
          />
        </PageSection>
      )}
    </>
  );
};
