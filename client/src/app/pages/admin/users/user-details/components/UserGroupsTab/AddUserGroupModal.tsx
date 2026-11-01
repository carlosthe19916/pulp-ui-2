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
  useDataViewSelection,
} from "@patternfly/react-data-view";

import type { GroupResponse } from "@app/client";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { PageBulkSelect } from "@app/components/PageBulkSelect";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { usePageInRange } from "@app/hooks/usePageInRange";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useGroupsListQuery } from "@app/queries/groups";
import { useUserGroupsBatchAddMutation } from "@app/queries/memberships";
import { useSuspenseUserDetailQuery } from "@app/queries/users";
import { notifyBatchResult } from "@app/utils/batchNotify";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";

import {
  ADD_USER_GROUP_STATE,
  SORTABLE_COLUMN_KEYS,
} from "./addUserGroupState";

/** Rows carry the group so a selection spanning pages still knows each one. */
type GroupRow = DataViewTrObject & { group: GroupResponse };

interface IAddUserGroupModalInnerProps {
  userHref: string;
  onClose: () => void;
}

const AddUserGroupModalInner: React.FC<IAddUserGroupModalInnerProps> = ({
  userHref,
  onClose,
}) => {
  const { data: user } = useSuspenseUserDetailQuery({ href: userHref });
  const { addNotification } = useNotifications();

  const [pagination, setPagination] = usePersistentState({
    ...ADD_USER_GROUP_STATE.pagination,
    storage: "state",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [sort, setSort] = usePersistentState({
    ...ADD_USER_GROUP_STATE.sort,
    storage: "state",
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
    ...ADD_USER_GROUP_STATE.filters,
    storage: "state",
  });
  const clearAllFilters = () => {
    setFilters(ADD_USER_GROUP_STATE.filters.defaultValue);
    toFirstPage();
  };
  const debouncedName = useDebouncedValue({ value: filters.name });

  const { data, isLoading, error } = useGroupsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
    },
  });
  usePageInRange({ pagination, setPagination, count: data?.count });

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
    { cell: "Name", props: { sort: sortProps("name"), width: 100 } },
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
            bulkSelect={
              <PageBulkSelect
                pageRows={rows.filter((row) => !memberHrefs.has(row.id))}
                selection={selection}
              />
            }
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
                onPaginationChange={setPagination}
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
