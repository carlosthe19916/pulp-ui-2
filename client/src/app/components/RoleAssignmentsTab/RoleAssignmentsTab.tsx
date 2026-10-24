import type React from "react";
import { useState } from "react";

import { Button, PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
  useDataViewFilters,
  useDataViewPagination,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { GroupRoleResponse, UserRoleResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useColumnSort } from "@app/hooks/useColumnSort";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import type { IRoleAssignmentListParams } from "@app/queries/roleAssignments";
import {
  useRoleAssignmentDeleteMutation,
  useRoleAssignmentsListQuery,
} from "@app/queries/roleAssignments";
import type { OrderingField } from "@app/queries/utils/listParams";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import { AddRoleAssignmentModal } from "./AddRoleAssignmentModal";

const SORTABLE_COLUMN_KEYS = [
  "role",
  "description",
  "pulp_created",
] as const satisfies readonly OrderingField<IRoleAssignmentListParams>[];

interface IRoleFilters {
  role: IRoleAssignmentListParams["role__icontains"];
}

interface IRoleAssignmentsTabProps {
  kind: "user" | "group";
  href: string;
  /** Username or group name, for toasts and confirmations. */
  name: string;
}

/** Server-paginated roles of a user or group, with assign/unassign. */
export const RoleAssignmentsTab: React.FC<IRoleAssignmentsTabProps> = ({
  kind,
  href,
  name,
}) => {
  const { addNotification } = useNotifications();

  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<
    UserRoleResponse | GroupRoleResponse | null
  >(null);

  const deleteMutation = useRoleAssignmentDeleteMutation({
    onSuccess: (_data, { assignment }) =>
      addNotification({
        title: `Role "${assignment.role}" removed from ${kind} "${name}"`,
        variant: "success",
      }),
    onError: (error, { assignment }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to remove role "${assignment.role}"`,
        }),
        variant: "danger",
      }),
  });

  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "role", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRoleFilters>({});
  const debouncedRole = useDebouncedValue({ value: filters.role });

  const { data, isLoading, error } = useRoleAssignmentsListQuery({
    kind,
    href,
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      role__icontains: debouncedRole || undefined,
    },
  });

  const assignments = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Role", props: { sort: sortProps("role"), width: 25 } },
    {
      cell: "Description",
      props: { sort: sortProps("description"), width: 40 },
    },
    { cell: "Permissions", props: { width: 15 } },
    { cell: "Created", props: { sort: sortProps("pulp_created"), width: 20 } },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const rows: DataViewTr[] = assignments.map((assignment) => ({
    id: assignment.pulp_href,
    row: [
      { cell: assignment.role, props: { dataLabel: "Role" } },
      {
        cell: assignment.description || "—",
        props: { dataLabel: "Description", modifier: "truncate" },
      },
      {
        cell: assignment.permissions?.length ?? 0,
        props: { dataLabel: "Permissions" },
      },
      {
        cell: formatDateTime(assignment.pulp_created) ?? "—",
        props: { dataLabel: "Created" },
      },
      {
        cell: (
          <ActionsColumn
            items={[
              { title: "Remove", onClick: () => setRemoveTarget(assignment) },
            ]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));

  const handleRemove = () => {
    if (!removeTarget?.pulp_href) return;
    deleteMutation.mutate(
      { kind, href, assignment: removeTarget },
      { onSuccess: () => setRemoveTarget(null) },
    );
  };

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: assignments.length === 0,
    emptyState: (
      <TableEmptyState
        title={`No roles assigned to this ${kind}`}
        filteredTitle="No roles match the filter"
        isFiltered={Boolean(debouncedRole)}
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
              <DataViewTextFilter filterId="role" title="Role" />
            </DataViewFilters>
          }
          actions={
            <Button variant="primary" onClick={() => setIsAddRoleOpen(true)}>
              Add Role
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
          aria-label={`${kind === "user" ? "User" : "Group"} roles table`}
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

      <AddRoleAssignmentModal
        isOpen={isAddRoleOpen}
        kind={kind}
        href={href}
        name={name}
        onClose={() => setIsAddRoleOpen(false)}
      />

      <ConfirmActionModal
        isOpen={!!removeTarget}
        title="Remove Role"
        body={`Are you sure you want to remove role "${removeTarget?.role}" from ${kind} "${name}"?`}
        isConfirming={deleteMutation.isPending}
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
};
