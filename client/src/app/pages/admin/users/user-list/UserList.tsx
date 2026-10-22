import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  Label,
  PageSection,
  PaginationVariant,
} from "@patternfly/react-core";
import { ActionsColumn } from "@patternfly/react-table";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
  useDataViewPagination,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { UserResponse } from "@app/client";
import { useNotifications } from "@app/hooks/useNotifications";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  dataViewBodyStates,
  useColumnSort,
  type DataViewTh,
  ListPagination,
} from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { UserModal } from "@app/components/UserModal";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import type { IUserListParams } from "@app/queries/users";
import { useUserDeleteMutation, useUsersListQuery } from "@app/queries/users";
import type { OrderingField } from "@app/queries/utils/listParams";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

const SORTABLE_COLUMN_KEYS = [
  "username",
  "date_joined",
] as const satisfies readonly OrderingField<IUserListParams>[];

interface IUserFilters {
  username: IUserListParams["username"];
}

export const UserList: React.FC = () => {
  const [modalState, setModalState] = useState<"create" | UserResponse | null>(
    null,
  );
  const userToEdit =
    modalState === "create" ? undefined : (modalState ?? undefined);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

  const { addNotification } = useNotifications();
  const deleteMutation = useUserDeleteMutation({
    onSuccess: (_data, { name }) =>
      addNotification({ title: `User "${name}" deleted`, variant: "success" }),
    onError: (error, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete user "${name}"`,
        }),
        variant: "danger",
      }),
  });
  const isDeleting = deleteMutation.isPending;

  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "username", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IUserFilters>({});
  const debouncedUsername = useDebouncedValue({ value: filters.username });

  const { data, isLoading, error } = useUsersListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      username__icontains: debouncedUsername || undefined,
    },
  });

  const users = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Username", props: { sort: sortProps("username"), width: 25 } },
    { cell: "Email", props: { width: 30 } },
    { cell: "Active", props: { width: 10 } },
    { cell: "Groups", props: { width: 20 } },
    {
      cell: "Date Joined",
      props: { sort: sortProps("date_joined"), width: 15 },
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
      {
        cell: user.pulp_href ? (
          <Link
            to="/admin/users/$userId"
            params={{ userId: extractIdFromHref(user.pulp_href) }}
          >
            {user.username}
          </Link>
        ) : (
          user.username
        ),
        props: { dataLabel: "Username" },
      },
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
          <ActionsColumn
            items={[
              { title: "Edit", onClick: () => setModalState(user) },
              {
                title: "Delete",
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

  const handleDelete = () => {
    const target = deleteTarget;
    if (!target?.pulp_href) return;
    deleteMutation.mutate(
      { href: target.pulp_href, name: target.username ?? "" },
      { onSuccess: () => setDeleteTarget(null) },
    );
  };

  return (
    <>
      <DocumentTitle title="Users" />
      <PageSection>
        <Content component={ContentVariants.h1}>Users</Content>
      </PageSection>
      <PageSection>
        <DataView activeState={activeState}>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            filters={
              <DataViewFilters
                onChange={(_key, newFilters) => {
                  onSetFilters(newFilters);
                  pagination.onSetPage(undefined, 1);
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
            pagination={
              <ListPagination
                variant={PaginationVariant.top}
                itemCount={totalCount}
                pagination={pagination}
              />
            }
          />

          <DataViewTable
            aria-label="Users table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar
            pagination={
              <ListPagination
                variant={PaginationVariant.bottom}
                itemCount={totalCount}
                pagination={pagination}
              />
            }
          />
        </DataView>

        <UserModal
          isOpen={modalState !== null}
          user={userToEdit}
          onClose={() => setModalState(null)}
        />

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete User"
          body={`Are you sure you want to delete "${deleteTarget?.username}"? This action cannot be undone.`}
          isConfirming={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};
