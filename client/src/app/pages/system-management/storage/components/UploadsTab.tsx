import type React from "react";
import { useState } from "react";

import prettyBytes from "pretty-bytes";

import { Label, PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  type DataViewTr,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { UploadResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectsPermissions } from "@app/hooks/useObjectPermissions";
import { usePageInRange } from "@app/hooks/usePageInRange";
import { usePersistentState } from "@app/hooks/usePersistentState";
import {
  useUploadDeleteMutation,
  useUploadsListQuery,
} from "@app/queries/uploads";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import { SORTABLE_COLUMN_KEYS, UPLOADS_TAB_STATE } from "./uploadsTabState";

export const UploadsTab: React.FC = () => {
  const { addNotification } = useNotifications();
  const [deleteTarget, setDeleteTarget] = useState<UploadResponse | null>(null);
  const [pagination, setPagination] = usePersistentState({
    ...UPLOADS_TAB_STATE.pagination,
    storage: "url",
  });
  const [sort, setSort] = usePersistentState({
    ...UPLOADS_TAB_STATE.sort,
    storage: "url",
  });
  const { ordering, sortProps } = columnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    sort,
    onSort: (next) => {
      setSort(next);
      setPagination((prev) => ({ ...prev, page: 1 }));
    },
  });
  const { data, isLoading, error } = useUploadsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
    },
  });
  usePageInRange({ pagination, setPagination, count: data?.count });
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

  const { disabledProps } = useObjectsPermissions({
    hrefs: uploads.map((item) => item.pulp_href ?? ""),
  });
  const totalCount = data?.count ?? 0;
  const columns: DataViewTh[] = [
    { cell: "Size", props: { sort: sortProps("size"), width: 30 } },
    { cell: "Status", props: { width: 40 } },
    { cell: "Started", props: { sort: sortProps("pulp_created"), width: 30 } },
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
              {
                title: "Delete",
                onClick: () => setDeleteTarget(upload),
                ...disabledProps({ href: upload.pulp_href, verb: "delete" }),
              },
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
            onPaginationChange={setPagination}
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
            onPaginationChange={setPagination}
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
