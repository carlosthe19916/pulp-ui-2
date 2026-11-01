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
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { GroupRoleResponse, UserRoleResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { usePersistentState } from "@app/hooks/usePersistentState";
import {
  useRoleAssignmentDeleteMutation,
  useRoleAssignmentsListQuery,
} from "@app/queries/roleAssignments";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import { AddRoleAssignmentModal } from "./AddRoleAssignmentModal";
import {
  ROLE_ASSIGNMENTS_STATE,
  SORTABLE_COLUMN_KEYS,
} from "./roleAssignmentsState";

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

  const [pagination, setPagination] = usePersistentState({
    ...ROLE_ASSIGNMENTS_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [sort, setSort] = usePersistentState({
    ...ROLE_ASSIGNMENTS_STATE.sort,
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
    ...ROLE_ASSIGNMENTS_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(ROLE_ASSIGNMENTS_STATE.filters.defaultValue);
    toFirstPage();
  };
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
                setFilters((prev) => ({ ...prev, ...newFilters }));
                toFirstPage();
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
              onPaginationChange={setPagination}
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
              onPaginationChange={setPagination}
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
        confirmVariant="primary"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
};
