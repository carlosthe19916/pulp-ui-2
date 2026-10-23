import type React from "react";
import { useState } from "react";

import prettyBytes from "pretty-bytes";

import { Label, PaginationVariant } from "@patternfly/react-core";
import { ActionsColumn } from "@patternfly/react-table";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  useDataViewPagination,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { UploadResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  dataViewBodyStates,
  ListPagination,
  useColumnSort,
  type DataViewTh,
} from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useNotifications } from "@app/hooks/useNotifications";
import {
  type IUploadListParams,
  useUploadDeleteMutation,
  useUploadsListQuery,
} from "@app/queries/uploads";
import type { OrderingField } from "@app/queries/utils/listParams";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

const SORTABLE_COLUMN_KEYS = [
  "size",
  "pulp_created",
] as const satisfies readonly OrderingField<IUploadListParams>[];

export const UploadsTab: React.FC = () => {
  const { addNotification } = useNotifications();
  const [deleteTarget, setDeleteTarget] = useState<UploadResponse | null>(null);
  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "pulp_created", direction: "desc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { data, isLoading, error } = useUploadsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
    },
  });
  const deleteMutation = useUploadDeleteMutation({
    onSuccess: () =>
      addNotification({ title: "Upload deleted", variant: "success" }),
    onError: (err) =>
      addNotification({
        ...getMutationErrorMessage({
          error: err,
          fallback: "Failed to delete upload",
        }),
        variant: "danger",
      }),
  });

  const uploads = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const columns: DataViewTh[] = [
    { cell: "Size", props: { sort: sortProps("size") } },
    { cell: "Status" },
    { cell: "Started", props: { sort: sortProps("pulp_created") } },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];
  const rows: DataViewTr[] = uploads.map((upload) => ({
    id: upload.pulp_href,
    row: [
      { cell: prettyBytes(upload.size), props: { dataLabel: "Size" } },
      {
        cell: upload.completed ? (
          <Label color="green" isCompact>
            Completed {formatDateTime(upload.completed)}
          </Label>
        ) : (
          <Label color="grey" isCompact>
            Incomplete
          </Label>
        ),
        props: { dataLabel: "Status" },
      },
      {
        cell: formatDateTime(upload.pulp_created) ?? "—",
        props: { dataLabel: "Started" },
      },
      {
        cell: (
          <ActionsColumn
            items={[
              { title: "Delete", onClick: () => setDeleteTarget(upload) },
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
    isEmpty: uploads.length === 0,
    emptyState: (
      <TableEmptyState
        title="No uploads"
        body="Large files are uploaded in chunks; unfinished uploads show here."
      />
    ),
  });

  return (
    <DataView activeState={activeState}>
      <DataViewToolbar
        pagination={
          <ListPagination
            variant={PaginationVariant.top}
            itemCount={totalCount}
            pagination={pagination}
          />
        }
      />
      <DataViewTable
        aria-label="Uploads table"
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
        title="Delete upload"
        body="Delete this upload and its chunks? An upload in progress will fail."
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
