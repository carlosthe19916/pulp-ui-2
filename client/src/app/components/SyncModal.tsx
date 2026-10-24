import type React from "react";

import type { RepositoryResponse } from "@app/client";
import { TaskActionModal } from "@app/components/TaskActionModal";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { useRepositorySyncMutation } from "@app/queries/repositories";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { buildResourceFilter } from "@app/utils/resourceFilter";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getPlugin, type IEntityField } from "@catalog";

const SYNC_FIELDS: IEntityField[] = [
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
    helpText: "Leave empty to sync from the repository's remote.",
  },
  { key: "mirror", label: "Mirror mode", type: "boolean" },
];

interface ISyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  repository: RepositoryResponse;
}

export const SyncModal: React.FC<ISyncModalProps> = ({
  isOpen,
  onClose,
  repository,
}) => {
  if (!isOpen) return null;
  return <SyncForm onClose={onClose} repository={repository} />;
};

const SyncForm: React.FC<Omit<ISyncModalProps, "isOpen">> = ({
  onClose,
  repository,
}) => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const plugin = getPlugin(resolvePulpType(repository.pulp_href) ?? "");
  // Collection sub-path used to rebuild the sync endpoint client-side.
  const apiPath = plugin?.entities.repository?.apiPath;

  const syncMutation = useRepositorySyncMutation({
    onSuccess: (data) =>
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: `Sync of "${repository.name}" started`,
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({ error, fallback: "Failed to start sync" }),
      ),
  });

  return (
    <TaskActionModal
      title={`Sync repository "${repository.name}"`}
      submitLabel="Sync"
      fields={SYNC_FIELDS}
      initialValues={{ remote: repository.remote ?? "" }}
      resourceFilter={buildResourceFilter({ kind: "repository", plugin })}
      isSubmitting={syncMutation.isPending}
      submitError={submitError}
      onSubmit={(body) => {
        clearSubmitError();
        if (!apiPath) {
          setSubmitError({
            title: "Failed to start sync",
            description: "This repository type does not support syncing.",
          });
          return;
        }
        syncMutation.mutate(
          {
            apiPath,
            id: extractIdFromHref(repository.pulp_href ?? ""),
            body: { mirror: false, ...body },
          },
          { onSuccess: onClose },
        );
      }}
      onClose={onClose}
    />
  );
};
