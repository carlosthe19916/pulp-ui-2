import type React from "react";
import { useMemo } from "react";

import {
  Button,
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
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useNotifications } from "@app/context/useNotifications";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import type { WithId } from "@app/models/models";
import { useGroupUsersBatchCreateMutation } from "@app/queries/groups";
import { useUsersListQuery } from "@app/queries/users";

const COLUMN_KEYS = ["username", "email", "name"] as const;
type UserColumnKey = (typeof COLUMN_KEYS)[number];

interface IUserFilters {
  username: string;
}

interface IAddGroupUserModalInnerProps {
  group: WithId<GroupResponse>;
  existingUsernames: string[];
  onClose: () => void;
}

/** Mounted only while open so the form resets and the user list is fetched only then. */
const AddGroupUserModalInner: React.FC<IAddGroupUserModalInnerProps> = ({
  group,
  existingUsernames,
  onClose,
}) => {
  const { addNotification } = useNotifications();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "username", direction: "asc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IUserFilters>({ initialFilters: { username: "" } });
  const debouncedUsername = useDebouncedValue(filters.username);

  const ordering = toOrderingParam(sortBy, direction) as
    "username" | "-username" | "email" | "-email" | undefined;

  const { data, isLoading, error } = useUsersListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    username__icontains: debouncedUsername || undefined,
  });

  const users = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const batchCreateMutation = useGroupUsersBatchCreateMutation();

  const existingSet = useMemo(
    () => new Set(existingUsernames),
    [existingUsernames],
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

  const columns = [
    { cell: "Username", props: { sort: sortProps("username") } },
    { cell: "Email", props: { sort: sortProps("email") } },
    "Name",
  ];

  const rows: DataViewTrObject[] = users.map((user) => ({
    id: user.username,
    row: [
      { cell: user.username, props: { dataLabel: "Username" } },
      { cell: user.email || "—", props: { dataLabel: "Email" } },
      {
        cell: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "—",
        props: { dataLabel: "Name" },
      },
    ],
  }));

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    hasSelectionColumn: true,
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
    const usernames = selection.selected
      .map((row) => row.id)
      .filter((id): id is string => !!id);
    if (usernames.length === 0) return;

    try {
      const { succeeded, failed } = await batchCreateMutation.mutateAsync({
        groupId: group.id,
        usernames,
      });
      if (succeeded.length > 0) {
        addNotification({
          title: `${succeeded.length} user${
            succeeded.length === 1 ? "" : "s"
          } added to group "${group.object.name}"`,
          variant: "success",
        });
      }
      if (failed.length > 0) {
        addNotification({
          title: `Failed to add ${failed.length} user${
            failed.length === 1 ? "" : "s"
          } to group "${group.object.name}": ${failed.join(", ")}`,
          variant: "danger",
        });
      }
      onClose();
    } catch {
      addNotification({
        title: "Failed to add users to group",
        variant: "danger",
      });
    }
  };

  const isSubmitting = batchCreateMutation.isPending;

  return (
    <Modal isOpen onClose={onClose} variant="large">
      <ModalHeader title="Add User to Group" />
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
                <DataViewTextFilter filterId="username" title="Username" />
              </DataViewFilters>
            }
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Select users"
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

interface IAddGroupUserModalProps {
  isOpen: boolean;
  group: WithId<GroupResponse>;
  existingUsernames: string[];
  onClose: () => void;
}

/** Mounted only while open so its table state and user query reset on every open. */
export const AddGroupUserModal: React.FC<IAddGroupUserModalProps> = ({
  isOpen,
  group,
  existingUsernames,
  onClose,
}) =>
  isOpen ? (
    <AddGroupUserModalInner
      group={group}
      existingUsernames={existingUsernames}
      onClose={onClose}
    />
  ) : null;
