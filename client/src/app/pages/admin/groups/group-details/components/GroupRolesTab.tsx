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

import type { GroupResponse, GroupRoleResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { buildThSort, dataViewBodyStates } from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useNotifications } from "@app/context/useNotifications";
import type { WithId } from "@app/models/models";
import {
  useAllGroupRolesListQuery,
  useGroupRoleDeleteMutation,
} from "@app/queries/groups";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { AddGroupRoleModal } from "./AddGroupRoleModal";

// The group-roles API only supports limit/offset — no server-side ordering or
// filtering — so all assignments are fetched and then paginated/sorted/filtered
// in memory.
const COLUMN_KEYS = ["role", "actions"] as const;
type RoleColumnKey = (typeof COLUMN_KEYS)[number];

interface IGroupRolesFilters {
  role: string;
}

interface IGroupRolesTabProps {
  group: WithId<GroupResponse>;
}

export const GroupRolesTab: React.FC<IGroupRolesTabProps> = ({ group }) => {
  const { addNotification } = useNotifications();

  const {
    data: rolesData,
    isLoading,
    error,
  } = useAllGroupRolesListQuery(group.id);

  const roleDeleteMutation = useGroupRoleDeleteMutation();

  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [removeRoleTarget, setRemoveRoleTarget] =
    useState<GroupRoleResponse | null>(null);

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "role", direction: "asc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IGroupRolesFilters>({
      initialFilters: { role: "" },
    });

  const allRoles = useMemo(
    () => rolesData?.results ?? [],
    [rolesData?.results],
  );

  const filteredSortedRoles = useMemo(() => {
    const query = filters.role.trim().toLowerCase();
    const filtered = query
      ? allRoles.filter((role) => role.role.toLowerCase().includes(query))
      : allRoles;

    if (sortBy !== "role") return filtered;

    const dir = direction === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => a.role.localeCompare(b.role) * dir);
  }, [allRoles, filters.role, sortBy, direction]);

  const totalCount = filteredSortedRoles.length;

  const pagedRoles = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredSortedRoles.slice(start, start + perPage);
  }, [filteredSortedRoles, page, perPage]);

  const sortProps = (columnKey: RoleColumnKey) =>
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

  const roleColumns = [
    { cell: "Role", props: { sort: sortProps("role") } },
    "Description",
    "Permissions",
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
  ];

  const roleRows: DataViewTr[] = pagedRoles.map((role) => {
    return {
      id: role.pulp_href,
      row: [
        {
          cell: role.role,
          props: { dataLabel: "Role" },
        },
        {
          cell: role.description ?? "—",
          props: { dataLabel: "Description" },
        },
        {
          cell: role.permissions?.length ?? 0,
          props: { dataLabel: "Permissions" },
        },
        {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: "Remove",
                  isDanger: true,
                  onClick: () => setRemoveRoleTarget(role),
                },
              ]}
            />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const handleRemoveRole = async () => {
    if (!removeRoleTarget?.pulp_href) return;
    try {
      await roleDeleteMutation.mutateAsync({
        groupId: group.id,
        assignmentId: extractIdFromHref(removeRoleTarget.pulp_href),
      });
      addNotification({
        title: `Role "${removeRoleTarget.role}" removed from group "${group.object.name}"`,
        variant: "success",
      });
    } catch {
      addNotification({
        title: "Failed to remove role from group",
        variant: "danger",
      });
    }
    setRemoveRoleTarget(null);
  };

  const groupRolesStates = dataViewBodyStates({
    columnCount: roleColumns.length,
    isLoading: isLoading,
    error,
    isEmpty: totalCount === 0,
    emptyState: (
      <TableEmptyState
        title="No roles assigned to this group"
        filteredTitle="No roles match the filter"
        isFiltered={Boolean(filters.role.trim())}
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
      <DataView activeState={groupRolesStates.activeState}>
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
              <DataViewTextFilter filterId="role" title="Role" />
            </DataViewFilters>
          }
          actions={
            <Button variant="primary" onClick={() => setIsAddRoleOpen(true)}>
              Add Role
            </Button>
          }
          pagination={pagination(PaginationVariant.top)}
        />
        <DataViewTable
          aria-label="Group roles table"
          columns={roleColumns}
          rows={roleRows}
          bodyStates={groupRolesStates.bodyStates}
        />
        <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
      </DataView>

      <AddGroupRoleModal
        isOpen={isAddRoleOpen}
        group={group}
        existingRoleNames={allRoles.map((r) => r.role)}
        onClose={() => setIsAddRoleOpen(false)}
      />

      <ConfirmActionModal
        isOpen={!!removeRoleTarget}
        title="Remove Role"
        body={`Are you sure you want to remove role "${removeRoleTarget?.role}" from the group?`}
        isConfirming={roleDeleteMutation.isPending}
        confirmLabel="Remove"
        onConfirm={() => void handleRemoveRole()}
        onCancel={() => setRemoveRoleTarget(null)}
      />
    </>
  );
};
