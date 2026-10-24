import type { IPlugin } from "@catalog";
import { useNotifications } from "@app/hooks/useNotifications";
import { type IUseEntityFormResult } from "@app/hooks/pluginForm/useEntityForm";
import { usePendingCreateRecorder } from "@app/hooks/usePendingCreateRecorder";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { usePublicationCreateMutation } from "@app/queries/publications";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { valuesToCreate } from "./PublicationForm";

interface IUsePublicationFormArgs {
  plugin: IPlugin | undefined;
  onClose: () => void;
}

/**
 * Publication create form (create-only — publications are immutable): maps form
 * values to a publication write body (`PublicationForm`) and runs the create
 * mutation. Create is async (202 + task). The success toast is raised from the
 * mutation's hook-level callbacks and the call-level `onSuccess` closes the modal
 * (see `.rulesync/rules/toastr.md`); a submission failure is shown in-form via `submitError`,
 * not a toast (see `.rulesync/rules/forms.md`).
 */
export const usePublicationForm = ({
  plugin,
  onClose,
}: IUsePublicationFormArgs): IUseEntityFormResult => {
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
