import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
  Pagination,
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
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates, useColumnSort } from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import type { IGroupListParams } from "@app/queries/groups";
import { useGroupsListQuery } from "@app/queries/groups";
import type { OrderingField } from "@app/queries/utils/listParams";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { GroupModal } from "../components/GroupModal";
import { useGroupActions } from "../hooks/useGroupActions";

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

  const { deleteGroup, isDeleting } = useGroupActions();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IGroupFilters>({});
  const debouncedName = useDebouncedValue(filters.name);

  const { data, isLoading, error } = useGroupsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name__icontains: debouncedName || undefined,
  });

  const groups = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns = [
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

  const handleDelete = async () => {
    if (!deleteTarget?.pulp_href) return;
    try {
      await deleteGroup(deleteTarget);
    } catch {
      // Notifications are handled in useGroupActions.
    }
    setDeleteTarget(null);
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
                  onSetPage(undefined, 1);
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
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Groups table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
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
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};
