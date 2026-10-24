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

import type { GroupResponse } from "@app/client";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useColumnSort } from "@app/hooks/useColumnSort";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import type { IGroupListParams } from "@app/queries/groups";
import { useGroupsListQuery } from "@app/queries/groups";
import { useUserGroupsBatchAddMutation } from "@app/queries/memberships";
import { useSuspenseUserDetailQuery } from "@app/queries/users";
import type { OrderingField } from "@app/queries/utils/listParams";
import { notifyBatchResult } from "@app/utils/batchNotify";
import type { DataViewTh } from "@app/utils/dataViewTypes";

const SORTABLE_COLUMN_KEYS = [
  "name",
] as const satisfies readonly OrderingField<IGroupListParams>[];

/** Rows carry the group so a selection spanning pages still knows each one. */
type GroupRow = DataViewTrObject & { group: GroupResponse };

interface IGroupFilters {
  name: string;
}

interface IAddUserGroupModalInnerProps {
  userHref: string;
  onClose: () => void;
}

const AddUserGroupModalInner: React.FC<IAddUserGroupModalInnerProps> = ({
  userHref,
  onClose,
}) => {
  const { data: user } = useSuspenseUserDetailQuery({ userHref });
  const { addNotification } = useNotifications();

  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IGroupFilters>({ initialFilters: { name: "" } });
  const debouncedName = useDebouncedValue({ value: filters.name });

  const { data, isLoading, error } = useGroupsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
    },
  });

  // Each request settles on its own, so failures arrive in `result`, not onError.
  const batchAddMutation = useUserGroupsBatchAddMutation({
    onSuccess: (result, { username }) =>
      notifyBatchResult({
        addNotification,
        result,
        item: "group",
        target: `user "${username}"`,
      }),
  });

  // `user.groups` lists every membership, so it marks joined groups on any page.
  const memberHrefs = new Set(user.groups?.map((group) => group.pulp_href));

  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name") } },
  ];

  const rows: GroupRow[] = (data?.results ?? []).flatMap((group) =>
    group.pulp_href
      ? [
          {
            id: group.pulp_href,
            group,
            row: [{ cell: group.name, props: { dataLabel: "Name" } }],
          },
        ]
      : [],
  );

  const totalCount = data?.count ?? 0;

  const selection = useDataViewSelection<GroupRow>({
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
        title="No groups found"
        isFiltered={Boolean(debouncedName)}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  const handleAdd = () =>
    batchAddMutation.mutate(
      {
        username: user.username,
        groups: selection.selected.map((row) => row.group),
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
            isSelectDisabled: (row: GroupRow) => memberHrefs.has(row.id),
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
                <DataViewTextFilter filterId="name" title="Name" />
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
            aria-label="Select groups"
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

interface IAddUserGroupModalProps extends IAddUserGroupModalInnerProps {
  isOpen: boolean;
}

/** Mounted only while open so its table state and group query reset on every open. */
export const AddUserGroupModal: React.FC<IAddUserGroupModalProps> = ({
  isOpen,
  ...props
}) => (isOpen ? <AddUserGroupModalInner {...props} /> : null);
