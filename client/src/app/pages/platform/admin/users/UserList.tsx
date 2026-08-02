import type React from "react";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import dayjs from "dayjs";

import {
  Button,
  Content,
  ContentVariants,
  Label,
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

import type { UserResponse } from "@app/client";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { RENDER_DATETIME_FORMAT } from "@app/Constants";
import { useNotifications } from "@app/context/useNotifications";
import { useUserDeleteMutation, useUsersListQuery } from "@app/queries/users";
import { isForbiddenError } from "@app/utils/isHttpError";
import { extractIdFromHref } from "@app/utils/pulpHref";

import { CreateUserModal } from "./CreateUserModal";

export const UserList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [usernameFilter, setUsernameFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteHref, setDeleteHref] = useState<string | null>(null);

  const { addNotification } = useNotifications();
  const deleteMutation = useUserDeleteMutation();

  const { data, isLoading, error } = useUsersListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    username__icontains: usernameFilter || undefined,
  });

  const users = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns = useMemo<ColumnDef<UserResponse>[]>(
    () => [
      {
        id: "username",
        header: "Username",
        cell: ({ row }) => {
          const userId = extractIdFromHref(row.original.pulp_href ?? "");
          return (
            <Link to="/admin/users/$userId" params={{ userId }}>
              {row.original.username}
            </Link>
          );
        },
      },
      {
        id: "email",
        header: "Email",
        cell: ({ row }) => row.original.email || "—",
      },
      {
        id: "is_active",
        header: "Active",
        cell: ({ row }) => (
          <Label color={row.original.is_active ? "green" : "grey"} isCompact>
            {row.original.is_active ? "Active" : "Inactive"}
          </Label>
        ),
      },
      {
        id: "groups",
        header: "Groups",
        cell: ({ row }) => row.original.groups?.length ?? 0,
      },
      {
        id: "date_joined",
        header: "Date Joined",
        cell: ({ row }) =>
          row.original.date_joined
            ? dayjs(row.original.date_joined).format(RENDER_DATETIME_FORMAT)
            : "—",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="link"
            isInline
            isDanger
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
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const handleDelete = async () => {
    if (!deleteHref) return;
    try {
      await deleteMutation.mutateAsync(deleteHref);
      addNotification({
        title: "User deleted",
        variant: "success",
      });
    } catch {
      addNotification({
        title: "Failed to delete user",
        variant: "danger",
      });
    }
    setDeleteHref(null);
  };

  if (isForbiddenError(error)) {
    return (
      <PageSection>
        <UnauthorizedState />
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Content component={ContentVariants.h1}>Users</Content>

      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              placeholder="Filter by username..."
              value={usernameFilter}
              onChange={(_e, value) => {
                setUsernameFilter(value);
                setPage(1);
              }}
              onClear={() => {
                setUsernameFilter("");
                setPage(1);
              }}
            />
          </ToolbarItem>
          <ToolbarItem>
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              Create user
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
        <Spinner aria-label="Loading users" />
      ) : (
        <Table aria-label="Users table" variant="compact">
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
            {users.length === 0 && (
              <Tr>
                <Td colSpan={columns.length}>No users found.</Td>
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

      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <Modal
        isOpen={!!deleteHref}
        onClose={() => setDeleteHref(null)}
        variant="small"
      >
        <ModalHeader title="Delete User" />
        <ModalBody>
          Are you sure you want to delete this user? This action cannot be
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
  );
};
