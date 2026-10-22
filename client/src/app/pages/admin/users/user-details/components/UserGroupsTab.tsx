import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { Button, PaginationVariant } from "@patternfly/react-core";
import { ActionsColumn } from "@patternfly/react-table";
import {
  DataView,
  DataViewToolbar,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  type DataViewTr,
  useDataViewFilters,
  useDataViewPagination,
} from "@patternfly/react-data-view";

import type { GroupResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  dataViewBodyStates,
  type DataViewTh,
  useColumnSort,
  ListPagination,
} from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import type { IGroupListParams } from "@app/queries/groups";
import { useGroupsListQuery } from "@app/queries/groups";
import { useMembershipRemoveMutation } from "@app/queries/memberships";
import { useSuspenseUserDetailQuery } from "@app/queries/users";
import type { OrderingField } from "@app/queries/utils/listParams";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

import { AddUserGroupModal } from "./AddUserGroupModal";

const SORTABLE_COLUMN_KEYS = [
  "name",
] as const satisfies readonly OrderingField<IGroupListParams>[];

interface IUserGroupsFilters {
  name: IGroupListParams["name__icontains"];
}

interface IUserGroupsTabProps {
  userHref: string;
}

export const UserGroupsTab: React.FC<IUserGroupsTabProps> = ({ userHref }) => {
  const { data: user } = useSuspenseUserDetailQuery({ userHref });
  const { addNotification } = useNotifications();

  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<GroupResponse | null>(null);

  const removeMutation = useMembershipRemoveMutation({
    onSuccess: (_data, { username, groupName }) =>
      addNotification({
        title: `User "${username}" removed from group "${groupName}"`,
        variant: "success",
      }),
    onError: (error, { username, groupName }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to remove user "${username}" from group "${groupName}"`,
        }),
        variant: "danger",
      }),
  });

  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IUserGroupsFilters>({});
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

  const groups = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name") } },
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
      {
        userHref,
        groupHref: removeTarget.pulp_href,
        username: user.username,
        groupName: removeTarget.name,
      },
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
                onSetFilters(newFilters);
                pagination.onSetPage(undefined, 1);
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
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
};
