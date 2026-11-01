import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { Button, PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { GroupResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { usePageInRange } from "@app/hooks/usePageInRange";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useGroupsListQuery } from "@app/queries/groups";
import { useMembershipRemoveMutation } from "@app/queries/memberships";
import { useSuspenseUserDetailQuery } from "@app/queries/users";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";
import { getMutationErrorMessage } from "@app/utils/utils";

import { AddUserGroupModal } from "./AddUserGroupModal";
import { SORTABLE_COLUMN_KEYS, USER_GROUPS_STATE } from "./userGroupsState";

interface IUserGroupsTabProps {
  userHref: string;
}

export const UserGroupsTab: React.FC<IUserGroupsTabProps> = ({ userHref }) => {
  const { data: user } = useSuspenseUserDetailQuery({ href: userHref });
  const { addNotification } = useNotifications();

  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<GroupResponse | null>(null);

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

  const [pagination, setPagination] = usePersistentState({
    ...USER_GROUPS_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [sort, setSort] = usePersistentState({
    ...USER_GROUPS_STATE.sort,
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
    ...USER_GROUPS_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(USER_GROUPS_STATE.filters.defaultValue);
    toFirstPage();
  };
  const debouncedName = useDebouncedValue({ value: filters.name });

  // There is no `users/{id}/groups/` endpoint, so page the groups collection
  // restricted to the memberships the user record lists. Groups have integer
  // pks, which `pulp_href__in` rejects, so filter by `id__in`.
  const groupIds = (user.groups ?? []).flatMap(({ pulp_href }) =>
    pulp_href ? [Number(extractIdFromHref(pulp_href))] : [],
  );

  const { data, isLoading, error } = useGroupsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
      id__in: groupIds,
    },
    // An empty `id__in` is ignored by the server and would list every group.
    options: { enabled: groupIds.length > 0 },
  });
  usePageInRange({ pagination, setPagination, count: data?.count });

  const groups = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name"), width: 100 } },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const rows: DataViewTr[] = groups.map((group) => ({
    id: group.pulp_href,
    row: [
      {
        cell: (
          <Link
            to="/admin/groups/$groupId"
            params={{ groupId: extractIdFromHref(group.pulp_href ?? "") }}
          >
            {group.name}
          </Link>
        ),
        props: { dataLabel: "Name" },
      },
      {
        cell: (
          <ActionsColumn
            items={[{ title: "Remove", onClick: () => setRemoveTarget(group) }]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));

  const handleRemove = () => {
    if (!removeTarget?.pulp_href) return;
    removeMutation.mutate(
      { user, group: removeTarget },
      { onSuccess: () => setRemoveTarget(null) },
    );
  };

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: groups.length === 0,
    emptyState: (
      <TableEmptyState
        title="User is not a member of any group"
        filteredTitle="No groups match the filter"
        isFiltered={Boolean(debouncedName)}
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
                setFilters((prev) => ({ ...prev, ...newFilters }));
                toFirstPage();
              }}
              values={filters}
            >
              <DataViewTextFilter filterId="name" title="Name" />
            </DataViewFilters>
          }
          actions={
            <Button variant="primary" onClick={() => setIsAddGroupOpen(true)}>
              Add Group
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
          aria-label="User groups table"
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

      <AddUserGroupModal
        isOpen={isAddGroupOpen}
        userHref={userHref}
        onClose={() => setIsAddGroupOpen(false)}
      />

      <ConfirmActionModal
        isOpen={!!removeTarget}
        title="Remove Group"
        body={`Are you sure you want to remove user "${user.username}" from group "${removeTarget?.name}"?`}
        isConfirming={removeMutation.isPending}
        confirmLabel="Remove"
        confirmVariant="primary"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
};
