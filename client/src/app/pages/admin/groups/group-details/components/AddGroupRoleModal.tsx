import type React from "react";
import { useMemo } from "react";

import {
  Button,
  EmptyState,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Pagination,
  PaginationVariant,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSelection,
  useDataViewSort,
  type DataViewTrObject,
} from "@patternfly/react-data-view";

import type { GroupResponse } from "@app/client";
import {
  buildThSort,
  dataViewBodyStates,
  toOrderingParam,
} from "@app/components/DataView";
import { useNotifications } from "@app/context/useNotifications";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import type { WithId } from "@app/models/models";
import { useGroupRolesBatchCreateMutation } from "@app/queries/groups";
import { useRolesListQuery } from "@app/queries/roles";

const COLUMN_KEYS = ["name", "description", "permissions"] as const;
type RoleColumnKey = (typeof COLUMN_KEYS)[number];

interface IRoleFilters {
  name: string;
}

interface IAddGroupRoleModalInnerProps {
  group: WithId<GroupResponse>;
  existingRoleNames: string[];
  onClose: () => void;
}

/** Mounted only while open so the table state and role list are fetched only then. */
const AddGroupRoleModalInner: React.FC<IAddGroupRoleModalInnerProps> = ({
  group,
  existingRoleNames,
  onClose,
}) => {
  const { addNotification } = useNotifications();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "name", direction: "asc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRoleFilters>({ initialFilters: { name: "" } });
  const debouncedName = useDebouncedValue(filters.name);

  const ordering = toOrderingParam(sortBy, direction) as
    "name" | "-name" | "description" | "-description" | undefined;

  const { data, isLoading, error } = useRolesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name__icontains: debouncedName || undefined,
  });

  const roles = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const batchCreateMutation = useGroupRolesBatchCreateMutation();

  const existingSet = useMemo(
    () => new Set(existingRoleNames),
    [existingRoleNames],
  );

  const selection = useDataViewSelection<DataViewTrObject>({
    matchOption: (a, b) => a.id === b.id,
  });
  const tableSelection = useMemo(
    () => ({
      ...selection,
      isSelectDisabled: (row: DataViewTrObject) =>
        existingSet.has(row.id ?? ""),
    }),
    [selection, existingSet],
  );
  const selectedCount = selection.selected.length;

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

  const columns = [
    { cell: "Role", props: { sort: sortProps("name") } },
    { cell: "Description", props: { sort: sortProps("description") } },
    "Permissions",
  ];

  const rows: DataViewTrObject[] = roles.map((role) => ({
    id: role.name,
    row: [
      { cell: role.name, props: { dataLabel: "Role" } },
      { cell: role.description || "—", props: { dataLabel: "Description" } },
      {
        cell: role.permissions?.length ?? 0,
        props: { dataLabel: "Permissions" },
      },
    ],
  }));

  const { activeState, bodyStates } = dataViewBodyStates({
    loading: isLoading,
    error,
    empty: roles.length === 0,
    emptyState: <EmptyState titleText="No roles found" headingLevel="h4" />,
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

  const onSubmit = async () => {
    const roleNames = selection.selected
      .map((row) => row.id)
      .filter((id): id is string => !!id);
    if (roleNames.length === 0) return;

    try {
      const { succeeded, failed } = await batchCreateMutation.mutateAsync({
        groupId: group.id,
        roleNames,
      });
      if (succeeded.length > 0) {
        addNotification({
          title: `${succeeded.length} role${
            succeeded.length === 1 ? "" : "s"
          } added to group "${group.object.name}"`,
          variant: "success",
        });
      }
      if (failed.length > 0) {
        addNotification({
          title: `Failed to add ${failed.length} role${
            failed.length === 1 ? "" : "s"
          } to group "${group.object.name}": ${failed.join(", ")}`,
          variant: "danger",
        });
      }
      onClose();
    } catch {
      addNotification({
        title: "Failed to add roles to group",
        variant: "danger",
      });
    }
  };

  const isSubmitting = batchCreateMutation.isPending;

  return (
    <Modal isOpen onClose={onClose} variant="large">
      <ModalHeader title="Add Role to Group" />
      <ModalBody>
        <DataView activeState={activeState} selection={tableSelection}>
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
                <DataViewTextFilter filterId="name" title="Role" />
              </DataViewFilters>
            }
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Select roles"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
        </DataView>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={() => void onSubmit()}
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

interface IAddGroupRoleModalProps {
  isOpen: boolean;
  group: WithId<GroupResponse>;
  existingRoleNames: string[];
  onClose: () => void;
}

/** Mounted only while open so its table state and role query reset on every open. */
export const AddGroupRoleModal: React.FC<IAddGroupRoleModalProps> = ({
  isOpen,
  group,
  existingRoleNames,
  onClose,
}) =>
  isOpen ? (
    <AddGroupRoleModalInner
      group={group}
      existingRoleNames={existingRoleNames}
      onClose={onClose}
    />
  ) : null;
