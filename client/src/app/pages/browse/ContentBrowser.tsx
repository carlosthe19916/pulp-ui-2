import type React from "react";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import {
  Breadcrumb,
  BreadcrumbItem,
  Content,
  ContentVariants,
  EmptyState,
  EmptyStateBody,
  PageSection,
  Pagination,
  SearchInput,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import type { FileFileContentResponse } from "@app/client";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { useApiDomain } from "@app/hooks/useApiDomain";
import {
  useBrowseDistributionDetailQuery,
  useBrowseFileContentListQuery,
  useBrowsePublicationDetailQuery,
  useBrowseRepositoryDetailQuery,
} from "@app/queries/browse";
import {
  buildDistributionHref,
  extractIdFromHref,
} from "@app/queries/utils/pulpHref";

type ContentRow = FileFileContentResponse & {
  size?: number;
};

interface IContentBrowserProps {
  distributionId: string;
}

function formatBytes(size: number | undefined): string {
  if (size === undefined || size === null) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export const ContentBrowser: React.FC<IContentBrowserProps> = ({
  distributionId,
}) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [pathFilter, setPathFilter] = useState("");

  const domain = useApiDomain();
  const distHref = buildDistributionHref(distributionId, domain);
  const {
    data: distribution,
    isLoading: isDistLoading,
    error: distError,
  } = useBrowseDistributionDetailQuery(distHref);

  const repoHref = distribution?.repository ?? "";
  const publicationHref = distribution?.publication ?? "";

  const { data: repository, isLoading: isRepoLoading } =
    useBrowseRepositoryDetailQuery(repoHref);

  const { data: publication, isLoading: isPublicationLoading } =
    useBrowsePublicationDetailQuery(publicationHref);

  const repositoryVersionHref =
    repository?.latest_version_href || publication?.repository_version || "";

  const { data: contentData, isLoading: isContentLoading } =
    useBrowseFileContentListQuery(
      {
        repository_version: repositoryVersionHref,
        relative_path__icontains: pathFilter || undefined,
        limit: perPage,
        offset: (page - 1) * perPage,
      },
      { enabled: !!repositoryVersionHref },
    );

  const contentUnits = (contentData?.results ?? []) as ContentRow[];
  const totalCount = contentData?.count ?? 0;
  const isResolvingVersion =
    (!!repoHref && isRepoLoading) ||
    (!!publicationHref && !repoHref && isPublicationLoading);

  const columns = useMemo<ColumnDef<ContentRow>[]>(
    () => [
      {
        id: "relative_path",
        header: "Path",
        cell: ({ row }) => {
          const href = row.original.pulp_href;
          const label = row.original.relative_path ?? "—";
          if (!href) return label;
          const contentId = extractIdFromHref(href);
          return (
            <Link
              to="/browse/$distributionId/$contentId"
              params={{ distributionId, contentId }}
            >
              {label}
            </Link>
          );
        },
      },
      {
        id: "size",
        header: "Size",
        cell: ({ row }) => formatBytes(row.original.size),
      },
      {
        id: "sha256",
        header: "Digest (SHA256)",
        cell: ({ row }) => {
          const value = row.original.sha256;
          if (!value) return "—";
          return value.length > 16 ? `${value.slice(0, 16)}...` : value;
        },
      },
    ],
    [distributionId],
  );

  const table = useReactTable({
    data: contentUnits,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <DetailQueryGate
      isLoading={isDistLoading}
      error={distError}
      hasData={!!distribution}
      loadingLabel="Loading distribution"
    >
      {distribution ? (
        <>
          <PageSection>
            <Breadcrumb>
              <BreadcrumbItem>
                <Link to="/browse">Browse</Link>
              </BreadcrumbItem>
              <BreadcrumbItem isActive>{distribution.name}</BreadcrumbItem>
            </Breadcrumb>
          </PageSection>

          <PageSection>
            <Content component={ContentVariants.h1}>
              {distribution.name}
            </Content>

            <Toolbar>
              <ToolbarContent>
                <ToolbarItem>
                  <SearchInput
                    placeholder="Filter by path..."
                    value={pathFilter}
                    onChange={(_e, value) => {
                      setPathFilter(value);
                      setPage(1);
                    }}
                    onClear={() => {
                      setPathFilter("");
                      setPage(1);
                    }}
                  />
                </ToolbarItem>
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

            {isResolvingVersion || isContentLoading ? (
              <Spinner aria-label="Loading content" />
            ) : !repositoryVersionHref ? (
              <EmptyState titleText="No content available" headingLevel="h4">
                <EmptyStateBody>
                  This distribution is not linked to a repository version or
                  publication with content yet.
                </EmptyStateBody>
              </EmptyState>
            ) : (
              <>
                <Table aria-label="Content table" variant="compact">
                  <Thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <Th key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </Th>
                        ))}
                      </Tr>
                    ))}
                  </Thead>
                  <Tbody>
                    {table.getRowModel().rows.map((row) => (
                      <Tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <Td key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </Td>
                        ))}
                      </Tr>
                    ))}
                    {contentUnits.length === 0 && (
                      <Tr>
                        <Td colSpan={columns.length}>
                          {pathFilter
                            ? "No content matches the current filter."
                            : "No content in this distribution version."}
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>

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
              </>
            )}
          </PageSection>
        </>
      ) : null}
    </DetailQueryGate>
  );
};
