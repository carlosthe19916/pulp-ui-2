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

  if (isForbiddenError(error)) {
    return (
      <PageSection>
        <UnauthorizedState />
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Content component={ContentVariants.h1}>Signing Services</Content>

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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Td>
                ))}
              </Tr>
            ))}
            {services.length === 0 && (
              <Tr>
                <Td colSpan={columns.length}>No signing services found.</Td>
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
    </PageSection>
  );
};
