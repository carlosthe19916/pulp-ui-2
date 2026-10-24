import type React from "react";
import { useState } from "react";

import {
  Button,
  PaginationVariant,
  ToggleGroup,
  ToggleGroupItem,
  ToolbarItem,
} from "@patternfly/react-core";
import { ActionsColumn } from "@patternfly/react-table";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  useDataViewPagination,
  type DataViewTr,
} from "@patternfly/react-data-view";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { RevealCellOnExpand } from "@app/components/RevealCellOnExpand";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { TaskActionModal } from "@app/components/TaskActionModal";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  type Exporter,
  useExportMutation,
  useExporterCreateMutation,
  useExporterDeleteMutation,
  useExportersListQuery,
  useExporterUpdateMutation,
  useExportsListQuery,
} from "@app/queries/exporters";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { buildDefaultValues } from "@app/utils/formSchema";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { EXPORTER_TYPES, type IExporterType } from "../utils/exporterTypes";
import { RunsTable } from "./RunsTable";

const ExportRuns: React.FC<{ href: string }> = ({ href }) => {
  const { data, isLoading } = useExportsListQuery({ href });
  return (
    <RunsTable
      label="Exports"
      runs={data?.results ?? []}
      isLoading={isLoading}
    />
  );
};

type Modal =
  | { kind: "create" }
  | { kind: "edit"; exporter: Exporter }
  | { kind: "export"; exporter: Exporter };

export const ExportersTab: React.FC = () => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const [exporterType, setExporterType] = useState<IExporterType>(
    EXPORTER_TYPES[0],
  );
  const [modal, setModal] = useState<Modal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exporter | null>(null);
  const pagination = useDataViewPagination({ perPage: 10 });
  const { data, isLoading, error } = useExportersListQuery({
    apiPath: exporterType.apiPath,
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering: "name",
    },
  });

  const closeModal = () => {
    clearSubmitError();
    setModal(null);
  };
  const onFormError = (fallback: string) => (err: unknown) =>
    setSubmitError(getMutationErrorMessage({ error: err, fallback }));
  const createMutation = useExporterCreateMutation({
    onSuccess: ({ name }) =>
      addNotification({
        title: `Exporter "${name}" created`,
        variant: "success",
      }),
    onError: onFormError("Failed to create exporter"),
  });
  const updateMutation = useExporterUpdateMutation({
    onSuccess: (result) =>
      "task" in result
        ? notifyTaskStarted({
            addNotification,
            taskHref: String(result.task),
            title: "Exporter update started",
          })
        : addNotification({ title: "Exporter saved", variant: "success" }),
    onError: onFormError("Failed to save exporter"),
  });
  const exportMutation = useExportMutation({
    onSuccess: (result) =>
      notifyTaskStarted({
        addNotification,
        taskHref: result.task,
        title: "Export started",
      }),
    onError: onFormError("Failed to start export"),
  });
  const deleteMutation = useExporterDeleteMutation({
    onSuccess: (result, { name }) =>
      notifyTaskStarted({
        addNotification,
        taskHref: result.task,
        title: `Deletion of exporter "${name}" started`,
      }),
    onError: (err, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error: err,
          fallback: `Failed to delete exporter "${name}"`,
        }),
        variant: "danger",
      }),
  });

  const exporters = (data?.results ?? []) as Exporter[];
  const totalCount = data?.count ?? 0;
  const columns: DataViewTh[] = [
    { cell: "Name" },
    { cell: "Path" },
    {
      cell: exporterType.apiPath === "core/pulp" ? "Repositories" : "Method",
    },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];
  const rows: DataViewTr[] = exporters.map((exporter) => ({
    id: exporter.pulp_href,
    row: [
      { cell: exporter.name, props: { dataLabel: "Name" } },
      { cell: exporter.path, props: { dataLabel: "Path" } },
      {
        cell: Array.isArray(exporter.repositories)
          ? exporter.repositories.length
          : String(exporter.method ?? "—"),
      },
      {
        cell: (
          <ActionsColumn
            items={[
              {
                title: "Export…",
                onClick: () => setModal({ kind: "export", exporter }),
              },
              {
                title: "Edit",
                onClick: () => setModal({ kind: "edit", exporter }),
              },
              { title: "Delete", onClick: () => setDeleteTarget(exporter) },
            ]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));
  const expandedRows = exporters.map((exporter) => ({
    rowId: exporter.pulp_href ?? "",
    columnId: 0,
    content: (
      <RevealCellOnExpand>
        {() => <ExportRuns href={exporter.pulp_href ?? ""} />}
      </RevealCellOnExpand>
    ),
  }));
  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: exporters.length === 0,
    emptyState: <TableEmptyState title="No exporters" />,
  });

  return (
    <>
      <DataView activeState={activeState}>
        <DataViewToolbar
          filters={
            <ToolbarItem>
              <ToggleGroup aria-label="Exporter type">
                {EXPORTER_TYPES.map((type) => (
                  <ToggleGroupItem
                    key={type.apiPath}
                    text={type.label}
                    isSelected={type.apiPath === exporterType.apiPath}
                    onChange={() => {
                      setExporterType(type);
                      pagination.onSetPage(undefined, 1);
                    }}
                  />
                ))}
              </ToggleGroup>
            </ToolbarItem>
          }
          actions={
            <Button
              variant="primary"
              onClick={() => setModal({ kind: "create" })}
            >
              Create exporter
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
          aria-label="Exporters table"
          columns={columns}
          rows={rows}
          bodyStates={bodyStates}
          isExpandable
          expandedRows={expandedRows}
          indexBy="id"
        />
      </DataView>

      {modal?.kind === "create" && (
        <TaskActionModal
          title={`Create ${exporterType.label} exporter`}
          submitLabel="Create"
          fields={exporterType.fields}
          isSubmitting={createMutation.isPending}
          submitError={submitError}
          onSubmit={(body) => {
            clearSubmitError();
            createMutation.mutate(
              { apiPath: exporterType.apiPath, body },
              { onSuccess: closeModal },
            );
          }}
          onClose={closeModal}
        />
      )}
      {modal?.kind === "edit" && (
        <TaskActionModal
          title={`Edit exporter "${modal.exporter.name}"`}
          submitLabel="Save"
          fields={exporterType.fields}
          initialValues={buildDefaultValues({
            fields: exporterType.fields,
            source: modal.exporter,
          })}
          isSubmitting={updateMutation.isPending}
          submitError={submitError}
          onSubmit={(body) => {
            clearSubmitError();
            updateMutation.mutate(
              { href: modal.exporter.pulp_href ?? "", body },
              { onSuccess: closeModal },
            );
          }}
          onClose={closeModal}
        />
      )}
      {modal?.kind === "export" && (
        <TaskActionModal
          title={`Export with "${modal.exporter.name}"`}
          submitLabel="Export"
          fields={exporterType.exportFields}
          isSubmitting={exportMutation.isPending}
          submitError={submitError}
          onSubmit={(body) => {
            clearSubmitError();
            exportMutation.mutate(
              { href: modal.exporter.pulp_href ?? "", body },
              { onSuccess: closeModal },
            );
          }}
          onClose={closeModal}
        />
      )}
      <ConfirmActionModal
        isOpen={!!deleteTarget}
        title="Delete exporter"
        body={`Delete exporter "${deleteTarget?.name}"? Files it exported stay on disk.`}
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleteTarget &&
          deleteMutation.mutate(deleteTarget, {
            onSuccess: () => setDeleteTarget(null),
          })
        }
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};
