import type React from "react";
import { useMemo, useState } from "react";

import {
  Button,
  Content,
  ContentVariants,
  EmptyState,
  Label,
  PageSection,
  Pagination,
  PaginationVariant,
} from "@patternfly/react-core";
import { ActionsColumn, TableText } from "@patternfly/react-table";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSort,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { UserResponse } from "@app/client";
import { buildThSort, dataViewBodyStates } from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useAllUsersListQuery } from "@app/queries/users";
import { formatDateTime, universalComparator } from "@app/utils/utils";

import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { UserCreateModal, UserEditModal } from "./components/UserModal";
import { UserRolesModal } from "./components/UserRolesModal";
import { useUserActions } from "./hooks/useUserActions";

const COLUMN_KEYS = [
  "username",
  "email",
  "is_active",
  "groups",
  "date_joined",
  "roles",
  "actions",
] as const;
type UserColumnKey = (typeof COLUMN_KEYS)[number];

interface IUserFilters {
  username: string;
}

export const UserList: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserResponse | null>(null);
  const [rolesUser, setRolesUser] = useState<UserResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

  const { deleteUser, isDeleting } = useUserActions();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "username", direction: "asc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IUserFilters>({ initialFilters: { username: "" } });

  const { data, isLoading, error } = useAllUsersListQuery();

  const filtered = useMemo(() => {
    const allUsers = data ?? [];
    return filters.username
      ? allUsers.filter((u) =>
          u.username.toLowerCase().includes(filters.username.toLowerCase()),
        )
      : allUsers;
  }, [data, filters.username]);

  const sorted = useMemo(() => {
    if (!sortBy) return filtered;
    const key = sortBy as keyof UserResponse;
    return [...filtered].sort((a, b) => {
      const cmp = universalComparator(
        a[key] as string | null,
        b[key] as string | null,
        "en",
      );
      return direction === "desc" ? -cmp : cmp;
    });
  }, [filtered, sortBy, direction]);

  const totalCount = filtered.length;
  const users = sorted.slice((page - 1) * perPage, page * perPage);

  const sortProps = (columnKey: UserColumnKey) =>
    buildThSort({
      columnKeys: COLUMN_KEYS,
      columnKey,
      sortBy,
      direction,
      onSort: (event, sortedKey, newDirection) => {
        onSort(event, sortedKey, newDirection);
        onSetPage(undefined, 1);
      },
    });

  const columns = [
    { cell: "Username", props: { sort: sortProps("username") } },
    "Email",
    "Active",
    "Groups",
    { cell: "Date Joined", props: { sort: sortProps("date_joined") } },
    { cell: "", props: { screenReaderText: "Manage roles" } },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const rows: DataViewTr[] = users.map((user) => ({
    id: user.pulp_href,
    row: [
      { cell: user.username, props: { dataLabel: "Username" } },
      { cell: user.email || "—", props: { dataLabel: "Email" } },
      {
        cell: (
          <Label color={user.is_active ? "green" : "grey"} isCompact>
            {user.is_active ? "Active" : "Inactive"}
          </Label>
        ),
        props: { dataLabel: "Active" },
      },
      { cell: user.groups?.length ?? 0, props: { dataLabel: "Groups" } },
      {
        cell: formatDateTime(user.date_joined) ?? "—",
        props: { dataLabel: "Date Joined" },
      },
      {
        cell: (
          <TableText>
            <Button variant="secondary" onClick={() => setRolesUser(user)}>
              Roles
            </Button>
          </TableText>
        ),
        props: { dataLabel: "Roles", modifier: "fitContent", hasAction: true },
      },
      {
        cell: (
          <ActionsColumn
            items={[
              { title: "Edit", onClick: () => setEditUser(user) },
              {
                title: "Delete",
                isDanger: true,
                onClick: () => setDeleteTarget(user),
              },
            ]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));

  const { activeState, bodyStates } = dataViewBodyStates({
    loading: isLoading,
    error,
    empty: users.length === 0,
    emptyState: <EmptyState titleText="No users found" headingLevel="h4" />,
  });

  const pagination = (variant: PaginationVariant) => (
    <Pagination
      variant={variant}
      itemCount={totalCount}
      page={page}
      perPage={perPage}
      onSetPage={onSetPage}
      onPerPageSelect={onPerPageSelect}
    />
  );

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
      <PageSection>
        <Content component={ContentVariants.h1}>Users</Content>

        <DataView activeState={activeState}>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            filters={
              <DataViewFilters
                onChange={(_key, newFilters) => {
                  onSetFilters(newFilters);
                  onSetPage(undefined, 1);
                }}
                values={filters}
              >
                <DataViewTextFilter filterId="username" title="Username" />
              </DataViewFilters>
            }
            actions={
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                Create user
              </Button>
            }
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Users table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
        </DataView>

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
    </>
  );
};
