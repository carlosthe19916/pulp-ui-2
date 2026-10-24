import type React from "react";
import { useState } from "react";

import { Button, PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  type DataViewTr,
  useDataViewPagination,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { PulpImporterResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { RevealCellOnExpand } from "@app/components/RevealCellOnExpand";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { TaskActionModal } from "@app/components/TaskActionModal";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  useImportCheckMutation,
  useImporterCreateMutation,
  useImporterDeleteMutation,
  useImportersListQuery,
  useImporterUpdateMutation,
  useImportMutation,
  useImportsListQuery,
} from "@app/queries/importers";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { buildDefaultValues } from "@app/utils/formSchema";
import { notifyTaskGroupStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import {
  IMPORT_CHECK_FIELDS,
  IMPORT_FIELDS,
  IMPORTER_FIELDS,
} from "../utils/exporterTypes";
import { RunsTable } from "./RunsTable";

interface IImportRunsProps {
  href: string;
}

const ImportRuns: React.FC<IImportRunsProps> = ({ href }) => {
  const { data, isLoading } = useImportsListQuery({ href });
  return (
    <RunsTable
      label="Imports"
      runs={data?.results ?? []}
      isLoading={isLoading}
    />
  );
};

type Modal =
  | { kind: "create" }
  | { kind: "check" }
  | { kind: "edit"; importer: PulpImporterResponse }
  | { kind: "import"; importer: PulpImporterResponse };

export const ImportersTab: React.FC = () => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const [modal, setModal] = useState<Modal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PulpImporterResponse | null>(
    null,
  );
  const pagination = useDataViewPagination({ perPage: 10 });
  const { data, isLoading, error } = useImportersListQuery({
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
  const createMutation = useImporterCreateMutation({
    onSuccess: ({ name }) =>
      addNotification({
        title: `Importer "${name}" created`,
        variant: "success",
      }),
    onError: onFormError("Failed to create importer"),
  });
  const updateMutation = useImporterUpdateMutation({
    onSuccess: ({ name }) =>
      addNotification({
        title: `Importer "${name}" saved`,
        variant: "success",
      }),
    onError: onFormError("Failed to save importer"),
  });
  const importMutation = useImportMutation({
    onSuccess: (result) =>
      notifyTaskGroupStarted({
        addNotification,
        taskGroupHref: result.task_group,
        title: "Import started",
      }),
    onError: onFormError("Failed to start import"),
  });
  const checkMutation = useImportCheckMutation({
    onSuccess: (result) => {
      const evaluations = Object.entries(result).filter(
        ([, evaluation]) => evaluation,
      );
      const isValid = evaluations.every(
        ([, evaluation]) => evaluation?.is_valid,
      );
      addNotification({
        title: isValid ? "The import looks valid" : "The import has problems",
        variant: isValid ? "success" : "warning",
        description: evaluations
          .flatMap(([key, evaluation]) =>
            (evaluation?.messages ?? []).map((message) => `${key}: ${message}`),
          )
          .join(" "),
      });
    },
    onError: onFormError("Failed to check the import"),
  });
  const deleteMutation = useImporterDeleteMutation({
    onSuccess: (_data, { name }) =>
      addNotification({
        title: `Importer "${name}" deleted`,
        variant: "success",
      }),
    onError: (err, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error: err,
          fallback: `Failed to delete importer "${name}"`,
        }),
        variant: "danger",
      }),
  });

  const importers = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const columns: DataViewTh[] = [
    { cell: "Name" },
    { cell: "Repository mapping" },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];
  const rows: DataViewTr[] = importers.map((importer) => ({
    id: importer.pulp_href,
    row: [
      { cell: importer.name, props: { dataLabel: "Name" } },
      {
        cell: importer.repo_mapping
          ? Object.entries(importer.repo_mapping)
              .map(([from, to]) => `${from} → ${String(to)}`)
              .join(", ") || "—"
          : "—",
        props: { dataLabel: "Repository mapping" },
      },
      {
        cell: (
          <ActionsColumn
            items={[
              {
                title: "Import…",
                onClick: () => setModal({ kind: "import", importer }),
              },
              {
                title: "Edit",
                onClick: () => setModal({ kind: "edit", importer }),
              },
              { title: "Delete", onClick: () => setDeleteTarget(importer) },
            ]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));
  const expandedRows = importers.map((importer) => ({
    rowId: importer.pulp_href ?? "",
    columnId: 0,
    content: (
      <RevealCellOnExpand>
        {() => <ImportRuns href={importer.pulp_href ?? ""} />}
      </RevealCellOnExpand>
    ),
  }));
  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: importers.length === 0,
    emptyState: <TableEmptyState title="No importers" />,
  });

  return (
    <>
      <DataView activeState={activeState}>
        <DataViewToolbar
          actions={
            <>
              <Button
                variant="primary"
                onClick={() => setModal({ kind: "create" })}
              >
                Create importer
              </Button>
              <Button
                variant="secondary"
                onClick={() => setModal({ kind: "check" })}
              >
                Check an import
              </Button>
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
          aria-label="Importers table"
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
          title="Create importer"
          submitLabel="Create"
          fields={IMPORTER_FIELDS}
          isSubmitting={createMutation.isPending}
          submitError={submitError}
          onSubmit={(body) => {
            clearSubmitError();
            createMutation.mutate(body, { onSuccess: closeModal });
          }}
          onClose={closeModal}
        />
      )}
      {modal?.kind === "edit" && (
        <TaskActionModal
          title={`Edit importer "${modal.importer.name}"`}
          submitLabel="Save"
          fields={IMPORTER_FIELDS}
          initialValues={buildDefaultValues({
            fields: IMPORTER_FIELDS,
            source: modal.importer,
          })}
          isSubmitting={updateMutation.isPending}
          submitError={submitError}
          onSubmit={(body) => {
            clearSubmitError();
            updateMutation.mutate(
              { href: modal.importer.pulp_href ?? "", body },
              { onSuccess: closeModal },
            );
          }}
          onClose={closeModal}
        />
      )}
      {modal?.kind === "import" && (
        <TaskActionModal
          title={`Import with "${modal.importer.name}"`}
          description="Give the export file, or the table of contents of a chunked export."
          submitLabel="Import"
          fields={IMPORT_FIELDS}
          isSubmitting={importMutation.isPending}
          submitError={submitError}
          onSubmit={(body) => {
            clearSubmitError();
            importMutation.mutate(
              { href: modal.importer.pulp_href ?? "", body },
              { onSuccess: closeModal },
            );
          }}
          onClose={closeModal}
        />
      )}
      {modal?.kind === "check" && (
        <TaskActionModal
          title="Check an import"
          description="Checks that the files exist and can be read, and that the mapping is valid, without importing."
          submitLabel="Check"
          fields={IMPORT_CHECK_FIELDS}
          isSubmitting={checkMutation.isPending}
          submitError={submitError}
          onSubmit={(body) => {
            clearSubmitError();
            checkMutation.mutate(body, { onSuccess: closeModal });
          }}
          onClose={closeModal}
        />
      )}
      <ConfirmActionModal
        isOpen={!!deleteTarget}
        title="Delete importer"
        body={`Delete importer "${deleteTarget?.name}"?`}
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
