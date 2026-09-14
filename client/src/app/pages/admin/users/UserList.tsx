import type React from "react";
import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";

import {
  Button,
  Content,
  ContentVariants,
  Label,
  PageSection,
  Pagination,
  SearchInput,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  ActionsColumn,
  Table,
  TableText,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import type { UserResponse } from "@app/client";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { useUsersListQuery } from "@app/queries/users";
import { isForbiddenError } from "@app/utils/isHttpError";
import { formatDateTime } from "@app/utils/utils";

import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { UserCreateModal, UserEditModal } from "./components/UserModal";
import { UserRolesModal } from "./components/UserRolesModal";
import { useUserActions } from "./hooks/useUserActions";

// Per-column PatternFly Th/Td props, carried on the TanStack column definition so
// the generic render loop below can apply them (e.g. action-cell styling).
declare module "@tanstack/react-table" {
  // Augmenting a third-party interface, so the name and unused type params are fixed.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/naming-convention
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Renders the header cell as visually-hidden text for accessibility. */
    screenReaderHeader?: string;
    /** Marks the body cell as an action cell (kebab/dropdown). */
    isActionCell?: boolean;
    /** Aligns an interactive body cell (e.g. inline button) with text cells. */
    hasAction?: boolean;
    /** Shrinks the column to fit its content. */
    fitContent?: boolean;
  }
}

export const UserList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [usernameFilter, setUsernameFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserResponse | null>(null);
  const [rolesUser, setRolesUser] = useState<UserResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

  const { deleteUser, isDeleting } = useUserActions();

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
        cell: ({ row }) => row.original.username,
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
        cell: ({ row }) => formatDateTime(row.original.date_joined) ?? "—",
      },
      {
        id: "roles",
        header: "",
        meta: {
          screenReaderHeader: "Manage roles",
          hasAction: true,
          fitContent: true,
        },
        cell: ({ row }) => (
          <TableText>
            <Button
              variant="secondary"
              onClick={() => setRolesUser(row.original)}
            >
              Roles
            </Button>
          </TableText>
        ),
      },
      {
        id: "actions",
        header: "",
        meta: { screenReaderHeader: "Actions", isActionCell: true },
        cell: ({ row }) => (
          <ActionsColumn
            items={[
              {
                title: "Edit",
                onClick: () => setEditUser(row.original),
              },
              {
                title: "Delete",
                isDanger: true,
                onClick: () => setDeleteTarget(row.original),
              },
            ]}
          />
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
    if (!deleteTarget?.pulp_href) return;
    try {
      await deleteUser(deleteTarget.pulp_href, deleteTarget.username);
    } catch {
      // Notifications are handled in useUserActions.
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <DocumentTitle title="Users" />
      {isForbiddenError(error) ? (
        <PageSection>
          <UnauthorizedState />
        </PageSection>
      ) : (
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

          <LoadingWrapper
            isFetching={isLoading}
            isFetchingState={<Spinner aria-label="Loading users" />}
          >
            <Table aria-label="Users table" variant="compact">
              <Thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <Tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const meta = header.column.columnDef.meta;
                      return (
                        <Th
                          key={header.id}
                          screenReaderText={meta?.screenReaderHeader}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </Th>
                      );
                    })}
                  </Tr>
                ))}
              </Thead>
              <Tbody>
                {table.getRowModel().rows.map((row) => (
                  <Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta;
                      return (
                        <Td
                          key={cell.id}
                          isActionCell={meta?.isActionCell}
                          hasAction={meta?.hasAction}
                          modifier={meta?.fitContent ? "fitContent" : undefined}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </Td>
                      );
                    })}
                  </Tr>
                ))}
                {users.length === 0 && (
                  <Tr>
                    <Td colSpan={columns.length}>No users found.</Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
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

          <UserCreateModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
          />

          {editUser && (
            <UserEditModal
              isOpen
              user={editUser}
              onClose={() => setEditUser(null)}
            />
          )}

          {rolesUser && (
            <UserRolesModal
              isOpen
              user={rolesUser}
              onClose={() => setRolesUser(null)}
            />
          )}

          <ConfirmDeleteModal
            isOpen={!!deleteTarget}
            title="Delete User"
            body={`Are you sure you want to delete "${deleteTarget?.username}"? This action cannot be undone.`}
            isDeleting={isDeleting}
            onConfirm={() => void handleDelete()}
            onCancel={() => setDeleteTarget(null)}
          />
        </PageSection>
      )}
    </>
  );
};
