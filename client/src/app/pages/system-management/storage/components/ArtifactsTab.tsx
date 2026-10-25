import type React from "react";
import { useState } from "react";

import prettyBytes from "pretty-bytes";

import { PaginationVariant, Switch, ToolbarItem } from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
  useDataViewFilters,
  useDataViewPagination,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { ArtifactResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useColumnSort } from "@app/hooks/useColumnSort";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import {
  type IArtifactListParams,
  useArtifactDeleteMutation,
  useArtifactsListQuery,
} from "@app/queries/artifacts";
import type { OrderingField } from "@app/queries/utils/listParams";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

const SORTABLE_COLUMN_KEYS = [
  "size",
  "pulp_created",
] as const satisfies readonly OrderingField<IArtifactListParams>[];

interface IArtifactFilters {
  sha256: string;
}

export const ArtifactsTab: React.FC = () => {
  const { addNotification } = useNotifications();
  const [orphanedOnly, setOrphanedOnly] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ArtifactResponse | null>(
    null,
  );
  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "pulp_created", direction: "desc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IArtifactFilters>({ initialFilters: { sha256: "" } });
  const sha256 = useDebouncedValue({ value: filters.sha256 });
  const { data, isLoading, error } = useArtifactsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      sha256: sha256 || undefined,
      orphaned_for: orphanedOnly ? 0 : undefined,
    },
  });
  const deleteMutation = useArtifactDeleteMutation({
    onSuccess: () =>
      addNotification({ title: "Artifact deleted", variant: "success" }),
    onError: (err) =>
      addNotification({
        ...getMutationErrorMessage({
          error: err,
          fallback: "Failed to delete artifact",
        }),
        variant: "danger",
      }),
  });

  const artifacts = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const columns: DataViewTh[] = [
    { cell: "File", props: { width: 30 } },
    { cell: "SHA-256", props: { width: 40 } },
    { cell: "Size", props: { sort: sortProps("size"), width: 10 } },
    { cell: "Created", props: { sort: sortProps("pulp_created"), width: 20 } },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];
  const rows: DataViewTr[] = artifacts.map((artifact) => ({
    id: artifact.pulp_href,
    row: [
      { cell: artifact.file, props: { dataLabel: "File" } },
      {
        cell: artifact.sha256 ?? "—",
        props: { dataLabel: "SHA-256", modifier: "truncate" },
      },
      {
        cell: artifact.size != null ? prettyBytes(artifact.size) : "—",
        props: { dataLabel: "Size" },
      },
      {
        cell: formatDateTime(artifact.pulp_created) ?? "—",
        props: { dataLabel: "Created" },
      },
      {
        cell: (
          <ActionsColumn
            items={[
              { title: "Delete", onClick: () => setDeleteTarget(artifact) },
            ]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));
  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: artifacts.length === 0,
    emptyState: (
      <TableEmptyState
        title={orphanedOnly ? "No orphaned artifacts" : "No artifacts found"}
        isFiltered={!!sha256}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  return (
    <DataView activeState={activeState}>
      <DataViewToolbar
        clearAllFilters={clearAllFilters}
        filters={
          <>
            <DataViewFilters
              onChange={(_key, newFilters) => {
                onSetFilters(newFilters);
                pagination.onSetPage(undefined, 1);
              }}
              values={filters}
            >
              <DataViewTextFilter filterId="sha256" title="SHA-256" />
            </DataViewFilters>
            <ToolbarItem alignSelf="center">
              <Switch
                id="artifacts-orphaned"
                label="Only orphaned"
                isChecked={orphanedOnly}
                onChange={(_event, checked) => {
                  setOrphanedOnly(checked);
                  pagination.onSetPage(undefined, 1);
                }}
              />
            </ToolbarItem>
          </>
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
        aria-label="Artifacts table"
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
      <ConfirmActionModal
        isOpen={!!deleteTarget}
        title="Delete artifact"
        body="Delete this artifact's file? Only artifacts no content uses can be deleted."
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleteTarget &&
          deleteMutation.mutate(deleteTarget, {
            onSuccess: () => setDeleteTarget(null),
          })
        }
        onCancel={() => setDeleteTarget(null)}
      />
    </DataView>
  );
};
