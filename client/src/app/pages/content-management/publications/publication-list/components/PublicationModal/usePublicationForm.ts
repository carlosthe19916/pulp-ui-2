import type { IPlugin } from "@catalog";

import { type IUseEntityFormResult } from "@app/hooks/pluginForm/useEntityForm";
import { useNotifications } from "@app/hooks/useNotifications";
import { usePendingCreateRecorder } from "@app/hooks/usePendingCreateRecorder";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { usePublicationCreateMutation } from "@app/queries/publications";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { valuesToCreate } from "./publicationForm";

interface IUsePublicationFormOptions {
  plugin: IPlugin | undefined;
  onClose: () => void;
}

/**
 * Publication create form (publications are immutable): maps values to a write body and
 * runs the async create; failures show in-form.
 */
export const usePublicationForm = ({
  plugin,
  onClose,
}: IUsePublicationFormOptions): IUseEntityFormResult => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const { recordPendingCreate } = usePendingCreateRecorder({
    entityType: "publication",
  });
  const entityPlugin = plugin?.entities.publication;

  const createMutation = usePublicationCreateMutation({
    onSuccess: (data) => {
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: "Publication create started",
      });
      recordPendingCreate({ taskHref: data.task, name: "" });
    },
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: "Failed to create publication",
        }),
      ),
  });
  const isSubmitting = createMutation.isPending;

  const onSubmit = (values: Record<string, unknown>) => {
    clearSubmitError();
    if (!entityPlugin) return;
    createMutation.mutate(
      { apiPath: entityPlugin.apiPath, body: valuesToCreate(values) },
      { onSuccess: () => onClose() },
    );
  };

  return { onSubmit, isSubmitting, submitError };
};
