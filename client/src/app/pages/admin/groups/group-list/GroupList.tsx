import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
  PaginationVariant,
} from "@patternfly/react-core";
import { ActionsColumn } from "@patternfly/react-table";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
  useDataViewPagination,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { GroupResponse } from "@app/client";
import { useNotifications } from "@app/hooks/useNotifications";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  dataViewBodyStates,
  useColumnSort,
  type DataViewTh,
  ListPagination,
} from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import type { IGroupListParams } from "@app/queries/groups";
import {
  useGroupDeleteMutation,
  useGroupsListQuery,
} from "@app/queries/groups";
import type { OrderingField } from "@app/queries/utils/listParams";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

import { GroupModal } from "../components/GroupModal";

const SORTABLE_COLUMN_KEYS = [
  "name",
] as const satisfies readonly OrderingField<IGroupListParams>[];

interface IGroupFilters {
  name: IGroupListParams["name"];
}

export const GroupList: React.FC = () => {
  const [modalState, setModalState] = useState<"create" | GroupResponse | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<GroupResponse | null>(null);

  const groupToEdit =
    modalState === "create" ? undefined : (modalState ?? undefined);

  const { addNotification } = useNotifications();
  const deleteMutation = useGroupDeleteMutation({
    onSuccess: (_data, { name }) =>
      addNotification({ title: `Group "${name}" deleted`, variant: "success" }),
    onError: (error, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete group "${name}"`,
        }),
        variant: "danger",
      }),
  });
  const isDeleting = deleteMutation.isPending;

  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IGroupFilters>({});
  const debouncedName = useDebouncedValue({ value: filters.name });

  const { data, isLoading, error } = useGroupsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
    },
  });

  const groups = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name") } },
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
  ];

  const rows: DataViewTr[] = groups.map((group) => {
    const groupId = extractIdFromHref(group.pulp_href ?? "");
    return {
      id: group.pulp_href,
      row: [
        {
          cell: (
            <Link to="/admin/groups/$groupId" params={{ groupId }}>
              {group.name}
            </Link>
          ),
          props: { dataLabel: "Name" },
        },
        {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: "Edit",
                  onClick: () => setModalState(group),
                },
                {
                  title: "Delete",
                  onClick: () => setDeleteTarget(group),
                },
              ]}
            />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading: isLoading,
    error,
    isEmpty: groups.length === 0,
    emptyState: (
      <TableEmptyState
        title="No groups found"
        isFiltered={Boolean(debouncedName)}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  const handleDelete = () => {
    const target = deleteTarget;
    if (!target?.pulp_href) return;
    deleteMutation.mutate(
      { href: target.pulp_href, name: target.name ?? "" },
      { onSuccess: () => setDeleteTarget(null) },
    );
  };

  return (
    <>
      <DocumentTitle title="Groups" />
      <PageSection>
        <Content component={ContentVariants.h1}>Groups</Content>

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
              <Button variant="primary" onClick={() => setModalState("create")}>
                Create Group
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
            aria-label="Groups table"
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

        <GroupModal
          isOpen={modalState !== null}
          group={groupToEdit}
          onClose={() => setModalState(null)}
        />

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete Group"
          body={`Are you sure you want to delete group "${deleteTarget?.name}"? This action cannot be undone.`}
          isConfirming={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};
