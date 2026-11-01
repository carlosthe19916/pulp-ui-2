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
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { UserResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { UserModal } from "@app/components/UserModal";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useUserDeleteMutation, useUsersListQuery } from "@app/queries/users";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import { SORTABLE_COLUMN_KEYS, USER_LIST_STATE } from "./userListState";

export const UserList: React.FC = () => {
  const [modalState, setModalState] = useState<"create" | UserResponse | null>(
    null,
  );
  const userToEdit =
    modalState === "create" ? undefined : (modalState ?? undefined);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

  const { addNotification } = useNotifications();
  const deleteMutation = useUserDeleteMutation({
    onSuccess: (_data, { username }) =>
      addNotification({
        title: `User "${username}" deleted`,
        variant: "success",
      }),
    onError: (error, { username }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete user "${username}"`,
        }),
        variant: "danger",
      }),
  });
  const isDeleting = deleteMutation.isPending;

  const [pagination, setPagination] = usePersistentState({
    ...USER_LIST_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [sort, setSort] = usePersistentState({
    ...USER_LIST_STATE.sort,
    storage: "url",
  });
  const { ordering, sortProps } = columnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    sort,
    onSort: (next) => {
      setSort(next);
      toFirstPage();
    },
  });

  const [filters, setFilters] = usePersistentState({
    ...USER_LIST_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(USER_LIST_STATE.filters.defaultValue);
    toFirstPage();
  };
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
    deleteMutation.mutate(target, { onSuccess: () => setDeleteTarget(null) });
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
                  setFilters((prev) => ({ ...prev, ...newFilters }));
                  toFirstPage();
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
                onPaginationChange={setPagination}
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
                onPaginationChange={setPagination}
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
