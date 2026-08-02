import type React from "react";
import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import {
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

import type { SigningServiceResponse } from "@app/client";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { useSigningServicesListQuery } from "@app/queries/signing-services";
import { isForbiddenError } from "@app/utils/isHttpError";

export const SigningServiceList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [nameFilter, setNameFilter] = useState("");

  const { data, isLoading, error } = useSigningServicesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    name: nameFilter || undefined,
  });

  const services = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns = useMemo<ColumnDef<SigningServiceResponse>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => row.original.name,
      },
      {
        id: "pubkey_fingerprint",
        header: "Public Key Fingerprint",
        cell: ({ row }) => {
          const fp = row.original.pubkey_fingerprint ?? "";
          return fp.length > 24 ? `${fp.slice(0, 24)}...` : fp || "—";
        },
      },
      {
        id: "script",
        header: "Script",
        cell: ({ row }) => row.original.script ?? "—",
      },
    ],
    [],
  );

  const table = useReactTable({
    data: services,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <>
      <DocumentTitle title="Signing Services" />
      {isForbiddenError(error) ? (
        <PageSection>
          <UnauthorizedState />
        </PageSection>
      ) : (
        <PageSection>
          <Content component={ContentVariants.h1}>Signing Services</Content>
          <Content component={ContentVariants.p}>
            Signing services are provisioned by an administrator via the Pulp
            API or CLI; they can&apos;t be created, edited, or deleted from this
            UI.
          </Content>

          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  placeholder="Filter by name..."
                  value={nameFilter}
                  onChange={(_e, value) => {
                    setNameFilter(value);
                    setPage(1);
                  }}
                  onClear={() => {
                    setNameFilter("");
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

          {isLoading ? (
            <Spinner aria-label="Loading signing services" />
          ) : services.length === 0 ? (
            <EmptyState titleText="No signing services found" headingLevel="h4">
              <EmptyStateBody>
                {nameFilter
                  ? "No signing services match the current filter. Try a different search term."
                  : "Signing services aren't managed from this UI. Ask an administrator to provision one via the Pulp API or CLI."}
              </EmptyStateBody>
            </EmptyState>
          ) : (
            <Table aria-label="Signing services table" variant="compact">
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
        </PageSection>
      )}
    </>
  );
};
