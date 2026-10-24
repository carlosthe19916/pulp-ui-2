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
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSelection,
  type DataViewTrObject,
} from "@patternfly/react-data-view";

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useColumnSort } from "@app/hooks/useColumnSort";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSuspenseGroupDetailQuery } from "@app/queries/groups";
import { useGroupUsersBatchAddMutation } from "@app/queries/memberships";
import type { IUserListParams } from "@app/queries/users";
import { useUsersListQuery } from "@app/queries/users";
import type { OrderingField } from "@app/queries/utils/listParams";
import { notifyBatchResult } from "@app/utils/batchNotify";
import type { DataViewTh } from "@app/utils/dataViewTypes";

const SORTABLE_COLUMN_KEYS = [
  "username",
  "email",
] as const satisfies readonly OrderingField<IUserListParams>[];

/** Rows carry the username so a selection spanning pages still knows each one. */
type UserRow = DataViewTrObject & {
  username: string;
  isMember: boolean;
};

interface IUserFilters {
  username: string;
}

interface IAddGroupUserModalInnerProps {
  groupHref: string;
  onClose: () => void;
}

const AddGroupUserModalInner: React.FC<IAddGroupUserModalInnerProps> = ({
  groupHref,
  onClose,
}) => {
  const { data: group } = useSuspenseGroupDetailQuery({ groupHref });
  const { addNotification } = useNotifications();

  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "username", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IUserFilters>({ initialFilters: { username: "" } });
  const debouncedUsername = useDebouncedValue({ value: filters.username });

  const { data, isLoading, error } = useUsersListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      username__icontains: debouncedUsername || undefined,
    },
  });

  // Each request settles on its own, so failures arrive in `result`, not onError.
  const batchAddMutation = useGroupUsersBatchAddMutation({
    onSuccess: (result) =>
      notifyBatchResult({
        addNotification,
        result,
        item: "user",
        target: `group "${group.name}"`,
      }),
  });

  const columns: DataViewTh[] = [
    { cell: "Username", props: { sort: sortProps("username"), width: 30 } },
    { cell: "Email", props: { sort: sortProps("email"), width: 40 } },
    { cell: "Name", props: { width: 30 } },
  ];

  const rows: UserRow[] = (data?.results ?? []).flatMap((user) =>
    user.pulp_href
      ? [
          {
            id: user.pulp_href,
            username: user.username,
            // Each user record embeds its groups, so membership shows on any page.
            isMember: !!user.groups?.some(
              (userGroup) => userGroup.pulp_href === groupHref,
            ),
            row: [
              { cell: user.username, props: { dataLabel: "Username" } },
              { cell: user.email || "—", props: { dataLabel: "Email" } },
              {
                cell:
                  `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
                  "—",
                props: { dataLabel: "Name" },
              },
            ],
          },
        ]
      : [],
  );

  const totalCount = data?.count ?? 0;

  const selection = useDataViewSelection<UserRow>({
    matchOption: (a, b) => a.id === b.id,
  });
  const selectedCount = selection.selected.length;
  const isSubmitting = batchAddMutation.isPending;

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    hasSelectionColumn: true,
    isLoading,
    error,
    isEmpty: rows.length === 0,
    emptyState: (
      <TableEmptyState
        title="No users found"
        isFiltered={Boolean(debouncedUsername)}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  const handleAdd = () =>
    batchAddMutation.mutate(
      {
        groupHref,
        usernames: selection.selected.map((row) => row.username),
      },
      // Keep the selection for a retry when nothing went through.
      { onSuccess: ({ succeeded }) => succeeded.length > 0 && onClose() },
    );

  return (
    <Modal isOpen onClose={onClose} variant="large">
      <ModalHeader title="Add User to Group" />
      <ModalBody>
        <DataView
          activeState={activeState}
          selection={{
            ...selection,
            isSelectDisabled: (row: UserRow) => row.isMember,
          }}
        >
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
            pagination={
              <ListPagination
                variant={PaginationVariant.top}
                itemCount={totalCount}
                pagination={pagination}
              />
            }
          />
          <DataViewTable
            aria-label="Select users"
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

interface IAddGroupUserModalProps extends IAddGroupUserModalInnerProps {
  isOpen: boolean;
}

/** Mounted only while open so its table state and user query reset on every open. */
export const AddGroupUserModal: React.FC<IAddGroupUserModalProps> = ({
  isOpen,
  ...props
}) => (isOpen ? <AddGroupUserModalInner {...props} /> : null);
