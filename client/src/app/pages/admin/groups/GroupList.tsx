import type React from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
  Pagination,
} from "@patternfly/react-core";
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

import { CreateGroupModal } from "./components/CreateGroupModal";
import { useGroupActions } from "./hooks/useGroupActions";

const COLUMN_KEYS = ["name", "actions"] as const;
type GroupColumnKey = (typeof COLUMN_KEYS)[number];

interface IGroupFilters {
  name: string;
}

export const GroupList: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GroupResponse | null>(null);

  const { deleteGroup, isDeleting } = useGroupActions();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 20,
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
            <Button
              variant="link"
              isDanger
              isInline
              onClick={() => setDeleteTarget(group)}
            >
              Delete
            </Button>
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

  const pagination = (
    <Pagination
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
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                Create Group
              </Button>
            }
            pagination={pagination}
          />

          <DataViewTable
            aria-label="Groups table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination} />
        </DataView>

        <CreateGroupModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
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
