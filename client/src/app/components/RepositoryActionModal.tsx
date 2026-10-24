import type React from "react";

import { TaskActionModal } from "@app/components/TaskActionModal";
import type { IRepositoryAction } from "@catalog";
import type { RepositoryResponse } from "@app/client";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { useRepositoryActionMutation } from "@app/queries/repositories";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

interface IRepositoryActionModalProps {
  action: IRepositoryAction;
  repository: RepositoryResponse;
  /** The repository, or the version a `target: "version"` action runs on. */
  targetHref: string;
  initialValues?: Record<string, unknown>;
  onClose: () => void;
}

/** Runs one catalog repository action through the shared action form. */
export const RepositoryActionModal: React.FC<IRepositoryActionModalProps> = ({
  action,
  repository,
  targetHref,
  initialValues,
  onClose,
}) => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const mutation = useRepositoryActionMutation({
    onSuccess: (data) => {
      if (data.task) {
        notifyTaskStarted({
          addNotification,
          taskHref: data.task,
          title: `${action.label} started`,
        });
      } else {
        addNotification({ title: `${action.label} started`, variant: "info" });
      }
    },
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: `Failed to start ${action.label.toLowerCase()}`,
        }),
      ),
  });

  const withRepository = (body: Record<string, unknown>) => {
    const param = action.repositoryParam;
    if (!param) return body;
    return {
      ...body,
      [param.key]: param.list ? [repository.pulp_href] : repository.pulp_href,
    };
  };

  return (
    <TaskActionModal
      title={`${action.label} — "${repository.name}"`}
      description={action.description}
      submitLabel={action.label}
      fields={action.fields}
      initialValues={initialValues}
      repository={repository}
      isSubmitting={mutation.isPending}
      submitError={submitError}
      onSubmit={(body) => {
        clearSubmitError();
        mutation.mutate(
          { targetHref, path: action.path, body: withRepository(body) },
          { onSuccess: onClose },
        );
      }}
      onClose={onClose}
    />
  );
};
