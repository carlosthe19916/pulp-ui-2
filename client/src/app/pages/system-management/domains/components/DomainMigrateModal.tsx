import type React from "react";

import type { IEntityField } from "@catalog";
import type { DomainResponse } from "@app/client";
import { TaskActionModal } from "@app/components/TaskActionModal";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { useDomainMigrateMutation } from "@app/queries/domains";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { STORAGE_BACKENDS } from "../storageBackends";

const MIGRATE_FIELDS: IEntityField[] = [
  {
    key: "storage_class",
    label: "New storage",
    type: "select",
    required: true,
    defaultValue: STORAGE_BACKENDS[0]?.value,
    options: STORAGE_BACKENDS.filter((backend) => !backend.deprecated).map(
      (backend) => ({ value: backend.value, label: backend.label }),
    ),
  },
  {
    key: "storage_settings",
    label: "Storage settings",
    type: "json",
    required: true,
    defaultValue: "{}",
    helpText:
      'The new backend\'s settings, e.g. {"bucket_name": "…", "access_key": "…", "secret_key": "…"} for S3.',
  },
];

/** Moves a domain's stored files to a new storage backend. */
export const DomainMigrateModal: React.FC<{
  domain: DomainResponse;
  onClose: () => void;
}> = ({ domain, onClose }) => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const mutation = useDomainMigrateMutation({
    onSuccess: (data, { domainName }) =>
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: `Storage migration of "${domainName}" started`,
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: "Failed to start the migration",
        }),
      ),
  });

  return (
    <TaskActionModal
      title={`Migrate storage — "${domain.name}"`}
      description="Copies every artifact to the new storage, then switches the domain to it. Files on the old storage are not deleted."
      submitLabel="Migrate"
      fields={MIGRATE_FIELDS}
      isSubmitting={mutation.isPending}
      submitError={submitError}
      onSubmit={(body) => {
        clearSubmitError();
        mutation.mutate(
          {
            domainName: domain.name,
            body: {
              storage_class: String(body.storage_class),
              storage_settings: body.storage_settings as Record<
                string,
                unknown
              >,
            },
          },
          { onSuccess: onClose },
        );
      }}
      onClose={onClose}
    />
  );
};
