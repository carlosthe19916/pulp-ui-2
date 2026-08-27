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
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import type { GroupResponse } from "@app/client";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { useNotifications } from "@app/context/useNotifications";
import {
  useGroupDeleteMutation,
  useGroupsListQuery,
} from "@app/queries/groups";
import { isForbiddenError } from "@app/utils/isHttpError";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

import { CreateGroupModal } from "./CreateGroupModal";

export const GroupList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [nameFilter, setNameFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteHref, setDeleteHref] = useState<string | null>(null);

  const { addNotification } = useNotifications();
  const deleteMutation = useGroupDeleteMutation();

  const { data, isLoading, error } = useGroupsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering: "name",
    name__icontains: nameFilter || undefined,
  });

  const groups = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns = useMemo<ColumnDef<GroupResponse>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => {
          const groupId = extractIdFromHref(row.original.pulp_href ?? "");
          return (
            <Link to="/admin/groups/$groupId" params={{ groupId }}>
              {row.original.name}
            </Link>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="link"
            isDanger
            isInline
            onClick={() => setDeleteHref(row.original.pulp_href ?? null)}
          >
            Delete
          </Button>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: groups,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const handleDelete = async () => {
    if (!deleteHref) return;
    try {
      await deleteMutation.mutateAsync(deleteHref);
      addNotification({
        title: "Group deleted",
        variant: "success",
      });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete group"),
        variant: "danger",
      });
    }
    setDeleteHref(null);
  };

  return (
    <>
      <DocumentTitle title="Groups" />
      {isForbiddenError(error) ? (
        <PageSection>
          <UnauthorizedState />
        </PageSection>
      ) : (
        <PageSection>
          <Content component={ContentVariants.h1}>Groups</Content>

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
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                  Create Group
                </Button>
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
            <Spinner aria-label="Loading groups" />
          ) : (
            <Table aria-label="Groups table" variant="compact">
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
                {groups.length === 0 && (
                  <Tr>
                    <Td colSpan={columns.length}>No groups found.</Td>
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

          <CreateGroupModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
          />

          <Modal
            isOpen={!!deleteHref}
            onClose={() => setDeleteHref(null)}
            variant="small"
          >
            <ModalHeader title="Delete Group" />
            <ModalBody>
              Are you sure you want to delete this group? This action cannot be
              undone.
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
