import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { Button, PaginationVariant } from "@patternfly/react-core";
import { ActionsColumn } from "@patternfly/react-table";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSort,
} from "@patternfly/react-data-view";

import type { GroupUserResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useNotifications } from "@app/hooks/useNotifications";
import {
  useAllGroupUsersListQuery,
  useSuspenseGroupDetailQuery,
} from "@app/queries/groups";
import { useMembershipRemoveMutation } from "@app/queries/memberships";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { buildThSort } from "@app/utils/sortHelpers";
import { getMutationErrorMessage } from "@app/utils/utils";

import { AddGroupUserModal } from "./AddGroupUserModal";

// `groups_users_list` supports only limit/offset — no server-side ordering or
// filtering — so all members are fetched and paginated/sorted/filtered here.
const COLUMN_KEYS = ["username"] as const;

interface IGroupUsersFilters {
  username: string;
}

interface IGroupUsersTabProps {
  groupHref: string;
}

export const GroupUsersTab: React.FC<IGroupUsersTabProps> = ({ groupHref }) => {
  const { data: group } = useSuspenseGroupDetailQuery({ groupHref });
  const { addNotification } = useNotifications();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<GroupUserResponse | null>(
    null,
  );

  const removeMutation = useMembershipRemoveMutation({
    onSuccess: (_data, { user, group }) =>
      addNotification({
        title: `User "${user.username}" removed from group "${group.name}"`,
        variant: "success",
      }),
    onError: (error, { user, group }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to remove user "${user.username}" from group "${group.name}"`,
        }),
        variant: "danger",
      }),
  });

  const { data, isLoading, error } = useAllGroupUsersListQuery({ groupHref });
  const allUsers = data?.results ?? [];

  const pagination = useDataViewPagination({ perPage: 10 });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "username", direction: "asc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IGroupUsersFilters>({
      initialFilters: { username: "" },
    });

  const query = filters.username.trim().toLowerCase();
  const sign = direction === "desc" ? -1 : 1;
  const visibleUsers = allUsers
    .filter((user) => user.username.toLowerCase().includes(query))
    .sort((a, b) =>
      sortBy === "username" ? a.username.localeCompare(b.username) * sign : 0,
    );
  const totalCount = visibleUsers.length;
  const pageStart = (pagination.page - 1) * pagination.perPage;
  const pagedUsers = visibleUsers.slice(
    pageStart,
    pageStart + pagination.perPage,
  );

  const columns: DataViewTh[] = [
    {
      cell: "Username",
      props: {
        sort: buildThSort({
          columnKeys: COLUMN_KEYS,
          columnKey: "username",
          sortBy,
          direction,
          onSort: (event, sortedKey, newDirection) => {
            onSort(event, sortedKey, newDirection);
            pagination.onSetPage(undefined, 1);
          },
        }),
      },
    },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  // Each member's `pulp_href` is the user's own `/users/{id}/` href.
  const rows: DataViewTr[] = pagedUsers.map((user) => ({
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
      {
        cell: (
          <ActionsColumn
            items={[{ title: "Remove", onClick: () => setRemoveTarget(user) }]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));

  const handleRemove = () => {
    if (!removeTarget?.pulp_href) return;
    removeMutation.mutate(
      { user: removeTarget, group },
      { onSuccess: () => setRemoveTarget(null) },
    );
  };

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: totalCount === 0,
    emptyState: (
      <TableEmptyState
        title="No users in this group"
        filteredTitle="No users match the filter"
        isFiltered={query !== ""}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  return (
    <>
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
            <Button variant="primary" onClick={() => setIsAddUserOpen(true)}>
              Add User
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
          aria-label="Group users table"
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

      <AddGroupUserModal
        isOpen={isAddUserOpen}
        groupHref={groupHref}
        onClose={() => setIsAddUserOpen(false)}
      />

      <ConfirmActionModal
        isOpen={!!removeTarget}
        title="Remove User"
        body={`Are you sure you want to remove user "${removeTarget?.username}" from group "${group.name}"?`}
        isConfirming={removeMutation.isPending}
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
};
