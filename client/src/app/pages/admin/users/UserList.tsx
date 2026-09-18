import type React from "react";
import { useState } from "react";

import {
  Button,
  Content,
  ContentVariants,
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
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  buildThSort,
  dataViewBodyStates,
  toOrderingParam,
} from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useUsersListQuery } from "@app/queries/users";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { formatDateTime } from "@app/utils/utils";

import { UserModal } from "./components/UserModal";
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
  const [modalState, setModalState] = useState<"create" | UserResponse | null>(
    null,
  );
  const userToEdit =
    modalState === "create" ? undefined : (modalState ?? undefined);
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
  const debouncedUsername = useDebouncedValue(filters.username);

  const ordering = toOrderingParam(sortBy, direction) as
    "username" | "-username" | "date_joined" | "-date_joined" | undefined;

  const { data, isLoading, error } = useUsersListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    username__icontains: debouncedUsername || undefined,
  });

  const users = data?.results ?? [];
  const totalCount = data?.count ?? 0;

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
    {
      cell: "",
      props: {
        screenReaderText: "Manage roles",
      },
    },
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
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
              { title: "Edit", onClick: () => setModalState(user) },
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
    columnCount: columns.length,
    isLoading: isLoading,
    error,
    isEmpty: users.length === 0,
    emptyState: (
      <TableEmptyState
        title="No users found"
        isFiltered={Boolean(debouncedUsername)}
        onClearFilters={clearAllFilters}
      />
    ),
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
      await deleteUser(
        extractIdFromHref(deleteTarget.pulp_href),
        deleteTarget.username,
      );
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
              <Button variant="primary" onClick={() => setModalState("create")}>
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

        <UserModal
          isOpen={modalState !== null}
          user={userToEdit}
          onClose={() => setModalState(null)}
        />

        {rolesUser && (
          <UserRolesModal
            isOpen
            user={rolesUser}
            onClose={() => setRolesUser(null)}
          />
        )}

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete User"
          body={`Are you sure you want to delete "${deleteTarget?.username}"? This action cannot be undone.`}
          isConfirming={isDeleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};
