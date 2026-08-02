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
  Button,
  Content,
  ContentVariants,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Pagination,
  SearchInput,
  Spinner,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import type { DistributionResponse } from "@app/client";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ReadOnlyBadge } from "@app/components/ReadOnlyBadge";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { useNotifications } from "@app/context/useNotifications";
import { usePlugins } from "@app/context/usePlugins";
import {
  getDescriptor,
  getDescriptorsForKind,
} from "@app/descriptors/registry";
import { useFileDistributionDeleteMutation } from "@app/queries/file-distributions";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { isForbiddenError } from "@app/utils/isHttpError";
import { extractIdFromHref } from "@app/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";

import { CreateDistributionModal } from "./CreateDistributionModal";

/**
 * The aggregation endpoint returns pulp_type at runtime but the generated
 * type does not include it. Extend the base type for list usage.
 */
type DistributionRow = DistributionResponse & { pulp_type?: string };

export const DistributionList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [nameFilter, setNameFilter] = useState("");
  const [pulpTypeFilter, setPulpTypeFilter] = useState("");
  const [deleteHref, setDeleteHref] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { addNotification } = useNotifications();
  const { plugins } = usePlugins();
  const deleteMutation = useFileDistributionDeleteMutation();

  const { data, isLoading, error } = useDistributionsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    name__icontains: nameFilter || undefined,
    pulp_type: pulpTypeFilter
      ? (pulpTypeFilter as NonNullable<
          Parameters<typeof useDistributionsListQuery>[0]
        >["pulp_type"])
      : undefined,
  });

  const distributions = (data?.results ?? []) as DistributionRow[];
  const totalCount = data?.count ?? 0;

  const canCreate = getDescriptorsForKind("distribution").some((d) =>
    d.isAvailable(plugins),
  );

  const handleDelete = async () => {
    if (!deleteHref) return;
    try {
      const result = await deleteMutation.mutateAsync(deleteHref);
      const taskHref = result?.task;
      if (taskHref) {
        notifyTaskStarted(
          addNotification,
          taskHref,
          "Distribution delete started",
        );
      }
    } catch {
      addNotification({
        title: "Failed to delete distribution",
        variant: "danger",
      });
    }
    setDeleteHref(null);
  };

  const columns = useMemo<ColumnDef<DistributionRow>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => {
          const pulpType = row.original.pulp_type;
          const descriptor = pulpType
            ? getDescriptor("distribution", pulpType)
            : undefined;
          if (!descriptor) {
            return row.original.name;
          }
          const distId = extractIdFromHref(row.original.pulp_href ?? "");
          return (
            <Link to="/distributions/$distId" params={{ distId }}>
              {row.original.name}
            </Link>
          );
        },
      },
      {
        id: "base_path",
        header: "Base Path",
        cell: ({ row }) => row.original.base_path || "—",
      },
      {
        id: "pulp_type",
        header: "Type",
        cell: ({ row }) => {
          const pulpType = row.original.pulp_type;
          return pulpType ? (
            <PulpTypeLabel kind="distribution" pulpType={pulpType} />
          ) : (
            "—"
          );
        },
      },
      {
        id: "repository",
        header: "Repository",
        cell: ({ row }) => (
          <ResourceHrefLink kind="repository" href={row.original.repository} />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const pulpType = row.original.pulp_type;
          const descriptor = pulpType
            ? getDescriptor("distribution", pulpType)
            : undefined;

          if (!descriptor) {
            return <ReadOnlyBadge pulpType={pulpType} />;
          }

          return (
            <Button
              variant="link"
              isInline
              isDanger
              onClick={() => setDeleteHref(row.original.pulp_href ?? null)}
            >
              Delete
            </Button>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: distributions,
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
      <Content component={ContentVariants.h1}>Distributions</Content>

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
          <ToolbarItem>
            <TextInput
              id="dist-pulp-type-filter"
              aria-label="Filter by pulp type"
              placeholder="pulp_type (e.g. file.file)"
              value={pulpTypeFilter}
              onChange={(_e, value) => {
                setPulpTypeFilter(value);
                setPage(1);
              }}
            />
          </ToolbarItem>
          {canCreate && (
            <ToolbarItem>
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                Create distribution
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
        <Spinner aria-label="Loading distributions" />
      ) : (
        <Table aria-label="Distributions table" variant="compact">
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
            {distributions.length === 0 && (
              <Tr>
                <Td colSpan={columns.length}>No distributions found.</Td>
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

      <CreateDistributionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <Modal
        isOpen={!!deleteHref}
        onClose={() => setDeleteHref(null)}
        variant="small"
      >
        <ModalHeader title="Delete Distribution" />
        <ModalBody>
          Are you sure you want to delete this distribution? This action cannot
          be undone.
        </ModalBody>
        <ModalFooter>
          <Button
            variant="danger"
            onClick={() => void handleDelete()}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
          <Button variant="link" onClick={() => setDeleteHref(null)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </PageSection>
  );
};
