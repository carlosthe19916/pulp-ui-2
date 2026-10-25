import type React from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PaginationVariant,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTrObject,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSelection,
} from "@patternfly/react-data-view";

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { PageBulkSelect } from "@app/components/PageBulkSelect";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useColumnSort } from "@app/hooks/useColumnSort";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import {
  useRoleAssignmentsBatchCreateMutation,
  useRoleAssignmentsListQuery,
} from "@app/queries/roleAssignments";
import type { IRoleListParams } from "@app/queries/roles";
import { useRolesListQuery } from "@app/queries/roles";
import type { OrderingField } from "@app/queries/utils/listParams";
import { notifyBatchResult } from "@app/utils/batchNotify";
import type { DataViewTh } from "@app/utils/dataViewTypes";

const SORTABLE_COLUMN_KEYS = [
  "name",
  "description",
] as const satisfies readonly OrderingField<IRoleListParams>[];

type RoleRow = DataViewTrObject & { roleName: string };

interface IRoleFilters {
  name: string;
}

interface IAddRoleAssignmentModalInnerProps {
  kind: "user" | "group";
  href: string;
  /** Username or group name, for toasts. */
  name: string;
  onClose: () => void;
}

const AddRoleAssignmentModalInner: React.FC<
  IAddRoleAssignmentModalInnerProps
> = ({ kind, href, name, onClose }) => {
  const { addNotification } = useNotifications();

  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRoleFilters>({ initialFilters: { name: "" } });
  const debouncedName = useDebouncedValue({ value: filters.name });

  const { data, isLoading, error } = useRolesListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
    },
  });
  const roles = data?.results ?? [];

  // Ask the server which visible roles are already assigned, instead of fetching
  // every assignment. This modal creates global assignments only, so only those
  // block a row; there is at most one global assignment per role, so `limit` is
  // exact.
  const visibleRoleNames = roles.map((role) => role.name);
  const { data: assignedData } = useRoleAssignmentsListQuery({
    kind,
    href,
    params: {
      limit: visibleRoleNames.length,
      role__in: visibleRoleNames,
      content_object: "null",
      domain: "null",
    },
    options: { enabled: visibleRoleNames.length > 0 },
  });
  const assignedNames = new Set(
    assignedData?.results.map((assignment) => assignment.role),
  );

  // Each request settles on its own, so failures arrive in `result`, not onError.
  const batchCreateMutation = useRoleAssignmentsBatchCreateMutation({
    onSuccess: (result) =>
      notifyBatchResult({
        addNotification,
        result,
        item: "role",
        target: `${kind} "${name}"`,
      }),
  });

  const columns: DataViewTh[] = [
    { cell: "Role", props: { sort: sortProps("name"), width: 25 } },
    {
      cell: "Description",
      props: { sort: sortProps("description"), width: 45 },
    },
    { cell: "Permissions", props: { width: 30 } },
  ];

  const rows: RoleRow[] = roles.map((role) => ({
    id: role.name,
    roleName: role.name,
    row: [
      { cell: role.name, props: { dataLabel: "Role" } },
      {
        cell: role.description || "—",
        props: { dataLabel: "Description", modifier: "truncate" },
      },
      {
        cell: role.permissions?.length ?? 0,
        props: { dataLabel: "Permissions" },
      },
    ],
  }));

  const totalCount = data?.count ?? 0;

  const selection = useDataViewSelection<RoleRow>({
    matchOption: (a, b) => a.id === b.id,
  });
  const selectedCount = selection.selected.length;
  const isSubmitting = batchCreateMutation.isPending;

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    hasSelectionColumn: true,
    isLoading,
    error,
    isEmpty: rows.length === 0,
    emptyState: (
      <TableEmptyState
        title="No roles found"
        isFiltered={Boolean(debouncedName)}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  const handleAdd = () =>
    batchCreateMutation.mutate(
      {
        kind,
        href,
        roleNames: selection.selected.map((row) => row.roleName),
      },
      // Keep the selection for a retry when nothing went through.
      { onSuccess: ({ succeeded }) => succeeded.length > 0 && onClose() },
    );

  return (
    <Modal isOpen onClose={onClose} variant="large">
      <ModalHeader
        title={`Add Role to ${kind === "user" ? "User" : "Group"}`}
      />
      <ModalBody>
        <DataView
          activeState={activeState}
          selection={{
            ...selection,
            isSelectDisabled: (row: RoleRow) => assignedNames.has(row.roleName),
          }}
        >
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            bulkSelect={
              <PageBulkSelect
                pageRows={rows.filter(
                  (row) => !assignedNames.has(row.roleName),
                )}
                selection={selection}
              />
            }
            filters={
              <DataViewFilters
                onChange={(_key, newFilters) => {
                  onSetFilters(newFilters);
                  pagination.onSetPage(undefined, 1);
                }}
                values={filters}
              >
                <DataViewTextFilter filterId="name" title="Role" />
              </DataViewFilters>
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
            aria-label="Select roles"
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
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleAdd}
          isDisabled={selectedCount === 0 || isSubmitting}
          isLoading={isSubmitting}
        >
          {selectedCount > 0 ? `Add (${selectedCount})` : "Add"}
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

interface IAddRoleAssignmentModalProps extends IAddRoleAssignmentModalInnerProps {
  isOpen: boolean;
}

/** Mounted only while open so its table state and role query reset on every open. */
export const AddRoleAssignmentModal: React.FC<IAddRoleAssignmentModalProps> = ({
  isOpen,
  ...props
}) => (isOpen ? <AddRoleAssignmentModalInner {...props} /> : null);
