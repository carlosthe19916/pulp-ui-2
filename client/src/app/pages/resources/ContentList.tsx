import type React from "react";
import { use, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

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
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import type { MultipleArtifactContentResponse } from "@app/client";
import { DocumentTitle } from "@app/components/DocumentTitle";
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

import { UploadModal } from "./actions/UploadModal";

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

  const columns = useMemo<ColumnDef<ContentRow>[]>(
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
            <Link to="/content/$contentId" params={{ contentId }}>
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

  const table = useReactTable({
    data: content,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
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

          {isLoading ? (
            <Spinner aria-label="Loading content" />
          ) : (
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
                {content.length === 0 && (
                  <Tr>
                    <Td colSpan={columns.length}>No content found.</Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          )}

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
