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

import type { RepositoryResponse } from "@app/client";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ReadOnlyBadge } from "@app/components/ReadOnlyBadge";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { useNotifications } from "@app/context/useNotifications";
import { usePlugins } from "@app/context/usePlugins";
import {
  getDescriptor,
  getDescriptorsForKind,
} from "@app/descriptors/registry";
import { useFileRepositoryDeleteMutation } from "@app/queries/file-repositories";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { isForbiddenError } from "@app/utils/isHttpError";
import { extractIdFromHref, resolvePulpType } from "@app/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { CreateRepositoryModal } from "./CreateRepositoryModal";
import { PublishModal } from "./actions/PublishModal";
import { SyncModal } from "./actions/SyncModal";

/**
 * The aggregation endpoint returns pulp_type at runtime but the generated
 * type does not include it. Extend the base type for list usage.
 */
type RepositoryRow = RepositoryResponse & { pulp_type?: string };

function truncate(value: string | null | undefined, max = 40): string {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export const RepositoryList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [nameFilter, setNameFilter] = useState("");
  const [pulpTypeFilter, setPulpTypeFilter] = useState("");
  const [deleteHref, setDeleteHref] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [syncTarget, setSyncTarget] = useState<RepositoryRow | null>(null);
  const [publishRepoHref, setPublishRepoHref] = useState<string | null>(null);

  const { addNotification } = useNotifications();
  const { plugins } = usePlugins();
  const deleteMutation = useFileRepositoryDeleteMutation();

  const { data, isLoading, error } = useRepositoriesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    name__icontains: nameFilter || undefined,
    pulp_type: pulpTypeFilter
      ? (pulpTypeFilter as NonNullable<
          Parameters<typeof useRepositoriesListQuery>[0]
        >["pulp_type"])
      : undefined,
  });

  const repositories = (data?.results ?? []) as RepositoryRow[];
  const totalCount = data?.count ?? 0;

  const canCreate = getDescriptorsForKind("repository").some((d) =>
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
          "Repository delete started",
        );
      }
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete repository"),
        variant: "danger",
      });
    }
    setDeleteHref(null);
  };

  const columns = useMemo<ColumnDef<RepositoryRow>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => {
          const repoId = extractIdFromHref(row.original.pulp_href ?? "");
          if (!repoId) {
            return row.original.name;
          }
          return (
            <Link to="/repositories/$repoId" params={{ repoId }}>
              {row.original.name}
            </Link>
          );
        },
      },
      {
        id: "description",
        header: "Description",
        cell: ({ row }) => truncate(row.original.description),
      },
      {
        id: "pulp_type",
        header: "Type",
        cell: ({ row }) => {
          const pulpType = resolvePulpType(
            row.original.pulp_type,
            row.original.pulp_href,
          );
          return pulpType ? (
            <PulpTypeLabel kind="repository" pulpType={pulpType} />
          ) : (
            "—"
          );
        },
      },
      {
        id: "remote",
        header: "Remote",
        cell: ({ row }) => truncate(row.original.remote),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const pulpType = resolvePulpType(
            row.original.pulp_type,
            row.original.pulp_href,
          );
          const descriptor = pulpType
            ? getDescriptor("repository", pulpType)
            : undefined;

          if (!descriptor) {
            return <ReadOnlyBadge pulpType={pulpType} />;
          }

          return (
            <>
              {descriptor.supportsSync && (
                <Button
                  variant="link"
                  isInline
                  onClick={() => setSyncTarget(row.original)}
                >
                  Sync
                </Button>
              )}
              {descriptor.supportsPublish && (
                <Button
                  variant="link"
                  isInline
                  onClick={() =>
                    setPublishRepoHref(row.original.pulp_href ?? null)
                  }
                >
                  Publish
                </Button>
              )}
              <Button
                variant="link"
                isInline
                isDanger
                onClick={() => setDeleteHref(row.original.pulp_href ?? null)}
              >
                Delete
              </Button>
            </>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: repositories,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <>
      <DocumentTitle title="Repositories" />
      {isForbiddenError(error) ? (
        <PageSection>
          <UnauthorizedState />
        </PageSection>
      ) : (
        <PageSection>
          <Content component={ContentVariants.h1}>Repositories</Content>

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
                  id="repo-pulp-type-filter"
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
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    Create repository
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
            <Spinner aria-label="Loading repositories" />
          ) : (
            <Table aria-label="Repositories table" variant="compact">
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
                {repositories.length === 0 && (
                  <Tr>
                    <Td colSpan={columns.length}>No repositories found.</Td>
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

          <CreateRepositoryModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
          />

          {syncTarget && (
            <SyncModal
              isOpen
              onClose={() => setSyncTarget(null)}
              repoHref={syncTarget.pulp_href ?? ""}
              remoteSuggestion={syncTarget.remote ?? undefined}
            />
          )}

          {publishRepoHref && (
            <PublishModal
              isOpen
              onClose={() => setPublishRepoHref(null)}
              repoHref={publishRepoHref}
            />
          )}

          <Modal
            isOpen={!!deleteHref}
            onClose={() => setDeleteHref(null)}
            variant="small"
          >
            <ModalHeader title="Delete Repository" />
            <ModalBody>
              Are you sure you want to delete this repository? This action
              cannot be undone.
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
      )}
    </>
  );
};
