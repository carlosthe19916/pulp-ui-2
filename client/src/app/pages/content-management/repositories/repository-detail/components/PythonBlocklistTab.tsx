import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  Button,
  Form,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PaginationVariant,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  type DataViewTr,
  useDataViewPagination,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type {
  PythonPythonBlocklistEntryResponse,
  RepositoryResponse,
} from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { FormSubmitError } from "@app/components/FormSubmitError";
import { GatedButton } from "@app/components/GatedButton";
import { HookFormPFTextInput } from "@app/components/HookFormPFTextInput";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  usePythonBlocklistCreateMutation,
  usePythonBlocklistDeleteMutation,
  usePythonBlocklistQuery,
} from "@app/queries/python-repositories";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

const entryLabel = (entry: PythonPythonBlocklistEntryResponse) =>
  entry.filename ||
  [entry.name, entry.version].filter(Boolean).join(" ") ||
  "entry";

interface IPythonBlocklistTabProps {
  repository: RepositoryResponse;
}

/** Packages this Python repository refuses, by name, version or filename. */
export const PythonBlocklistTab: React.FC<IPythonBlocklistTabProps> = ({
  repository,
}) => {
  const repositoryHref = repository.pulp_href ?? "";
  const { disabledProps } = useObjectPermissions({ href: repositoryHref });
  const { addNotification } = useNotifications();
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<PythonPythonBlocklistEntryResponse | null>(null);
  const pagination = useDataViewPagination({ perPage: 10 });
  const { data, isLoading, error } = usePythonBlocklistQuery({
    repositoryHref,
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
    },
  });
  const deleteMutation = usePythonBlocklistDeleteMutation({
    onSuccess: (_data, entry) =>
      addNotification({
        title: `Removed "${entryLabel(entry)}" from the blocklist`,
        variant: "success",
      }),
    onError: (err) =>
      addNotification({
        ...getMutationErrorMessage({
          error: err,
          fallback: "Failed to remove blocklist entry",
        }),
        variant: "danger",
      }),
  });

  const entries = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const rows: DataViewTr[] = entries.map((entry) => ({
    id: entry.pulp_href,
    row: [
      { cell: entry.name || "—", props: { dataLabel: "Name" } },
      { cell: entry.version || "—", props: { dataLabel: "Version" } },
      { cell: entry.filename || "—", props: { dataLabel: "Filename" } },
      { cell: entry.added_by || "—", props: { dataLabel: "Added by" } },
      {
        cell: formatDateTime(entry.pulp_created) ?? "—",
        props: { dataLabel: "Added" },
      },
      {
        cell: (
          <ActionsColumn
            items={[
              {
                title: "Remove",
                onClick: () => setDeleteTarget(entry),
                ...disabledProps("modify"),
              },
            ]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));
  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: 6,
    isLoading,
    error,
    isEmpty: entries.length === 0,
    emptyState: (
      <TableEmptyState
        title="No blocked packages"
        body="Blocked packages are skipped by sync and refused on upload."
      />
    ),
  });

  return (
    <>
      <DataView activeState={activeState}>
        <DataViewToolbar
          actions={
            <GatedButton
              variant="secondary"
              onClick={() => setIsAdding(true)}
              {...disabledProps("modify")}
            >
              Block a package
            </GatedButton>
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
          aria-label="Blocklist"
          columns={[
            "Name",
            "Version",
            "Filename",
            "Added by",
            "Added",
            { cell: "", props: { screenReaderText: "Actions" } },
          ]}
          rows={rows}
          bodyStates={bodyStates}
        />
      </DataView>
      {isAdding && (
        <AddBlocklistEntryModal
          repositoryHref={repositoryHref}
          onClose={() => setIsAdding(false)}
        />
      )}
      <ConfirmActionModal
        isOpen={!!deleteTarget}
        title="Remove blocklist entry"
        body={`Allow "${deleteTarget ? entryLabel(deleteTarget) : ""}" again?`}
        confirmLabel="Remove"
        confirmVariant="primary"
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

const entrySchema = yup
  .object({
    name: yup.string().default(""),
    version: yup.string().default(""),
    filename: yup.string().default(""),
  })
  .test(
    "name-or-filename",
    "Enter a package name or a filename",
    (values) => !!values.name || !!values.filename,
  );

type EntryFormValues = yup.InferType<typeof entrySchema>;

interface IAddBlocklistEntryModalProps {
  repositoryHref: string;
  onClose: () => void;
}

const AddBlocklistEntryModal: React.FC<IAddBlocklistEntryModalProps> = ({
  repositoryHref,
  onClose,
}) => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EntryFormValues>({
    resolver: yupResolver(entrySchema),
    defaultValues: { name: "", version: "", filename: "" },
  });
  const mutation = usePythonBlocklistCreateMutation({
    onSuccess: () =>
      addNotification({ title: "Package blocked", variant: "success" }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({ error, fallback: "Failed to block package" }),
      ),
  });

  return (
    <Modal isOpen onClose={onClose} variant="small">
      <ModalHeader
        title="Block a package"
        description="Block every version of a package, one version, or one file."
      />
      <ModalBody>
        <Form
          id="blocklist-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit((values) => {
              clearSubmitError();
              mutation.mutate(
                {
                  repositoryHref,
                  body: {
                    name: values.name || null,
                    version: values.version || null,
                    filename: values.filename || null,
                  },
                },
                { onSuccess: onClose },
              );
            })();
          }}
        >
          <FormSubmitError
            error={
              submitError ??
              (errors.root?.message ? { title: errors.root.message } : null)
            }
          />
          <HookFormPFTextInput
            control={control}
            name="name"
            label="Package name"
            fieldId="blocklist-name"
          />
          <HookFormPFTextInput
            control={control}
            name="version"
            label="Version"
            fieldId="blocklist-version"
          />
          <HookFormPFTextInput
            control={control}
            name="filename"
            label="Filename"
            fieldId="blocklist-filename"
          />
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          type="submit"
          form="blocklist-form"
          isLoading={mutation.isPending}
          isDisabled={mutation.isPending}
        >
          Block
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
