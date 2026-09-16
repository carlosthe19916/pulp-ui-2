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
  useDataViewSort,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { GroupResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  buildThSort,
  dataViewBodyStates,
  toOrderingParam,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useGroupsListQuery } from "@app/queries/groups";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { GroupModal } from "../components/GroupModal";
import { useGroupActions } from "../hooks/useGroupActions";

const COLUMN_KEYS = ["name", "actions"] as const;
type GroupColumnKey = (typeof COLUMN_KEYS)[number];

interface IGroupFilters {
  name: string;
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
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "name", direction: "asc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IGroupFilters>({ initialFilters: { name: "" } });

  const ordering = toOrderingParam(sortBy, direction) as "name" | "-name";

  const { data, isLoading, error } = useGroupsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name__icontains: filters.name || undefined,
  });

  const groups = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const sortProps = (columnKey: GroupColumnKey) =>
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
    { cell: "Name", props: { sort: sortProps("name") } },
    { cell: "", props: { screenReaderText: "Actions" } },
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
                  isDanger: true,
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
    loading: isLoading,
    error,
    empty: groups.length === 0,
    emptyState: "No groups found.",
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
      await deleteGroup(deleteTarget.pulp_href, deleteTarget.name);
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
