import type React from "react";

import type { RepositoryResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import type { IContentUnitRef } from "@app/hooks/useContentUnitSelection";
import { useNotifications } from "@app/hooks/useNotifications";
import type { IContentChangeStartedParams } from "@app/hooks/useReportContentChangeStarted";
import { useRepositoryModifyMutation } from "@app/queries/repositories";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getPulpType } from "@catalog";

import { RemoveContentBody } from "./RemoveContentBody";

interface IRemoveContentModalProps {
  repository: RepositoryResponse;
  /** The units to remove; absent removes all content (typed confirmation). */
  units?: IContentUnitRef[];
  onClose: () => void;
  onStarted: (change: IContentChangeStartedParams) => void;
}

/** Confirms removing content from a repository, then runs the change. */
export const RemoveContentModal: React.FC<IRemoveContentModalProps> = ({
  repository,
  units,
  onClose,
  onStarted,
}) => {
  const { addNotification } = useNotifications();
  const modifyMutation = useRepositoryModifyMutation({
    onSuccess: (data, variables) =>
      onStarted({ taskHref: data.task, ...variables }),
    onError: (error) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Could not remove content from "${repository.name}"`,
        }),
        variant: "danger",
      }),
  });
  const remove = units ? units.map((unit) => unit.href) : ["*"];
  const confirm = () =>
    modifyMutation.mutate(
      { repository, body: { remove_content_units: remove } },
      { onSuccess: onClose },
    );

  if (!units) {
    return (
      <ConfirmActionModal
        isOpen
        title={`Remove all content from "${repository.name}"?`}
        titleIconVariant="warning"
        body={
          "This creates a new version with no content. Older versions keep their " +
          'content. To undo, use "Restore as latest" on the previous version.'
        }
        confirmText={repository.name}
        confirmLabel="Remove all"
        confirmVariant="primary"
        isConfirming={modifyMutation.isPending}
        onConfirm={confirm}
        onCancel={onClose}
      />
    );
  }

  const isContainer =
    getPulpType(resolvePulpType(repository.pulp_href) ?? "")?.entities
      .repository?.contentChanges === "addRemove";
  return (
    <ConfirmActionModal
      isOpen
      title={`Remove ${units.length === 1 ? "1 unit" : `${units.length} units`} from "${repository.name}"?`}
      body={<RemoveContentBody units={units} isContainer={isContainer} />}
      confirmLabel="Remove"
      confirmVariant="primary"
      isConfirming={modifyMutation.isPending}
      onConfirm={confirm}
      onCancel={onClose}
    />
  );
};
