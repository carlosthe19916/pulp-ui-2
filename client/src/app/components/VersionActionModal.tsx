import type React from "react";

import type {
  RepositoryResponse,
  RepositoryVersionResponse,
} from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import type { useContentChangeTask } from "@app/hooks/useContentChangeTask";
import { useNotifications } from "@app/hooks/useNotifications";
import {
  useRepositoryModifyMutation,
  useRepositoryVersionDeleteMutation,
  useRepositoryVersionRepairMutation,
} from "@app/queries/repositories";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

export type VersionAction = "restore" | "repair" | "delete";

interface IVersionActionModalProps {
  action: VersionAction;
  version: RepositoryVersionResponse;
  repository: RepositoryResponse;
  onClose: () => void;
  /** Restore is a content change: the page follows it to the end. */
  onRestoreStarted: ReturnType<typeof useContentChangeTask>["watch"];
  /** Called after a delete is accepted (e.g. to leave the deleted version's page). */
  onDeleted?: () => void;
}

/** Confirms and runs a repository version action. */
export const VersionActionModal: React.FC<IVersionActionModalProps> = ({
  action,
  version,
  repository,
  onClose,
  onRestoreStarted,
  onDeleted,
}) => {
  const { addNotification } = useNotifications();
  const number = String(version.number);
  const name = `"${repository.name}"`;
  const notifyError = ({
    error,
    fallback,
  }: {
    error: unknown;
    fallback: string;
  }) =>
    addNotification({
      ...getMutationErrorMessage({ error, fallback }),
      variant: "danger",
    });

  const deleteMutation = useRepositoryVersionDeleteMutation({
    onSuccess: (data) => {
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: `Deleting version ${number} of ${name}`,
      });
      onDeleted?.();
    },
    onError: (error) =>
      notifyError({ error, fallback: `Could not delete version ${number}` }),
  });
  const repairMutation = useRepositoryVersionRepairMutation({
    onSuccess: (data) =>
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: `Repairing version ${number} of ${name}`,
      }),
    onError: (error) =>
      notifyError({ error, fallback: `Could not repair version ${number}` }),
  });
  const restoreMutation = useRepositoryModifyMutation({
    onSuccess: (data, variables) =>
      onRestoreStarted({ taskHref: data.task, ...variables }),
    onError: (error) =>
      notifyError({ error, fallback: `Could not restore version ${number}` }),
  });

  const confirm = () => {
    const close = { onSuccess: onClose };
    if (action === "delete") deleteMutation.mutate(version, close);
    if (action === "repair") repairMutation.mutate(version, close);
    if (action === "restore") {
      restoreMutation.mutate(
        { repository, body: { base_version: version.pulp_href ?? "" } },
        close,
      );
    }
  };

  const isLatest = version.pulp_href === repository.latest_version_href;
  const copy = {
    restore: {
      title: `Restore version ${number} as latest?`,
      body: `This creates a new latest version of ${name} with exactly the content of version ${number}. No version is deleted.`,
      confirmLabel: "Restore",
    },
    repair: {
      title: `Repair version ${number}?`,
      body: "This checks the version's artifacts and downloads again the ones that are missing or corrupted.",
      confirmLabel: "Repair",
    },
    delete: {
      title: `Delete version ${number}?`,
      body: isLatest
        ? "The previous version becomes the latest. This action cannot be undone."
        : "This action cannot be undone.",
      confirmLabel: "Delete",
    },
  }[action];

  return (
    <ConfirmActionModal
      isOpen
      title={copy.title}
      titleIconVariant={action === "delete" ? "warning" : undefined}
      body={copy.body}
      confirmLabel={copy.confirmLabel}
      confirmVariant="primary"
      isConfirming={
        deleteMutation.isPending ||
        repairMutation.isPending ||
        restoreMutation.isPending
      }
      onConfirm={confirm}
      onCancel={onClose}
    />
  );
};
