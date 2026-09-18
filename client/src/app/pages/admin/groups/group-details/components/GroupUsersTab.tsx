import type React from "react";
import { useMemo, useState } from "react";

import { Button, Pagination, PaginationVariant } from "@patternfly/react-core";
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

import type { GroupResponse, GroupUserResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { buildThSort, dataViewBodyStates } from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useNotifications } from "@app/context/useNotifications";
import type { WithId } from "@app/models/models";
import {
  useAllGroupUsersListQuery,
  useGroupUserDeleteMutation,
} from "@app/queries/groups";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { AddGroupUserModal } from "./AddGroupUserModal";

// The group-users API only supports limit/offset — no server-side ordering or
// filtering — so all members are fetched (paging through every page) and then
// paginated/sorted/filtered in memory.
const COLUMN_KEYS = ["username", "actions"] as const;
type UserColumnKey = (typeof COLUMN_KEYS)[number];

interface IGroupUsersFilters {
  username: string;
}

interface IGroupUsersTabProps {
  group: WithId<GroupResponse>;
}

export const GroupUsersTab: React.FC<IGroupUsersTabProps> = ({ group }) => {
  const { addNotification } = useNotifications();

  const {
    data: usersData,
    isLoading,
    error,
  } = useAllGroupUsersListQuery(group.id);

  const userDeleteMutation = useGroupUserDeleteMutation();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [removeUserTarget, setRemoveUserTarget] =
    useState<GroupUserResponse | null>(null);

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "username", direction: "asc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IGroupUsersFilters>({
      initialFilters: { username: "" },
    });

  const allUsers = useMemo(
    () => usersData?.results ?? [],
    [usersData?.results],
  );

  const filteredSortedUsers = useMemo(() => {
    const query = filters.username.trim().toLowerCase();
    const filtered = query
      ? allUsers.filter((user) => user.username.toLowerCase().includes(query))
      : allUsers;

    if (sortBy !== "username") return filtered;

    const dir = direction === "desc" ? -1 : 1;
    return [...filtered].sort(
      (a, b) => a.username.localeCompare(b.username) * dir,
    );
  }, [allUsers, filters.username, sortBy, direction]);

  const totalCount = filteredSortedUsers.length;

  const pagedUsers = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredSortedUsers.slice(start, start + perPage);
  }, [filteredSortedUsers, page, perPage]);

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

  const userColumns = [
    { cell: "Username", props: { sort: sortProps("username") } },
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
  ];

  const userRows: DataViewTr[] = pagedUsers.map((user) => ({
    id: user.pulp_href,
    row: [
      { cell: user.username, props: { dataLabel: "Username" } },
      {
        cell: (
          <ActionsColumn
            items={[
              {
                title: "Remove",
                isDanger: true,
                onClick: () => setRemoveUserTarget(user),
              },
            ]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));

  const handleRemoveUser = async () => {
    if (!removeUserTarget?.pulp_href) return;
    try {
      await userDeleteMutation.mutateAsync({
        groupId: group.id,
        userId: extractIdFromHref(removeUserTarget.pulp_href),
      });
      addNotification({
        title: `User "${removeUserTarget.username}" removed from group "${group.object.name}"`,
        variant: "success",
      });
    } catch {
      addNotification({
        title: "Failed to remove user from group",
        variant: "danger",
      });
    }
    setRemoveUserTarget(null);
  };

  const groupUsersStates = dataViewBodyStates({
    columnCount: userColumns.length,
    isLoading: isLoading,
    error,
    isEmpty: totalCount === 0,
    emptyState: (
      <TableEmptyState
        title="No users in this group"
        filteredTitle="No users match the filter"
        isFiltered={Boolean(filters.username.trim())}
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

  return (
    <>
      <DataView activeState={groupUsersStates.activeState}>
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
            <Button variant="primary" onClick={() => setIsAddUserOpen(true)}>
              Add User
            </Button>
          }
          pagination={pagination(PaginationVariant.top)}
        />
        <DataViewTable
          aria-label="Group users table"
          columns={userColumns}
          rows={userRows}
          bodyStates={groupUsersStates.bodyStates}
        />
        <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
      </DataView>

      <AddGroupUserModal
        isOpen={isAddUserOpen}
        group={group}
        existingUsernames={allUsers.map((u) => u.username)}
        onClose={() => setIsAddUserOpen(false)}
      />

      <ConfirmActionModal
        isOpen={!!removeUserTarget}
        title="Remove User"
        body={`Are you sure you want to remove user "${removeUserTarget?.username}" from the group?`}
        isConfirming={userDeleteMutation.isPending}
        confirmLabel="Remove"
        onConfirm={() => void handleRemoveUser()}
        onCancel={() => setRemoveUserTarget(null)}
      />
    </>
  );
};
