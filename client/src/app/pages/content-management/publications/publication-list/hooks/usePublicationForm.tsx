import type { IPlugin } from "@catalog";
import { useNotifications } from "@app/context/useNotifications";
import { type IUseEntityFormResult } from "@app/hooks/pluginForm/useEntityForm";
import { usePublicationCreateMutation } from "@app/queries/publications";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { valuesToCreate } from "../components/PublicationForm";

interface IUsePublicationFormArgs {
  plugin: IPlugin | undefined;
  onClose: () => void;
}

/**
 * Publication create form (create-only — publications are immutable): maps form
 * values to a publication write body (`PublicationForm`) and runs the create
 * mutation. Create is async (202 + task). The toast is raised from the mutation's
 * hook-level callbacks (survive unmount); the call-level `onSuccess` closes the
 * modal on success only (see `evals/toastr.md`).
 */
export const usePublicationForm = ({
  plugin,
  onClose,
}: IUsePublicationFormArgs): IUseEntityFormResult => {
  const { addNotification } = useNotifications();
  const entityPlugin = plugin?.entities.publication;

  const createMutation = usePublicationCreateMutation({
    onSuccess: (data) =>
      notifyTaskStarted(
        addNotification,
        data.task,
        "Publication create started",
      ),
    onError: (error) =>
      addNotification({
        ...getMutationErrorMessage(error, "Failed to create publication"),
        variant: "danger",
      }),
  });
  const isSubmitting = createMutation.isPending;

  const onSubmit = (values: Record<string, unknown>) => {
    if (!entityPlugin) return;
    createMutation.mutate(
      { apiPath: entityPlugin.apiPath, body: valuesToCreate(values) },
      { onSuccess: () => onClose() },
    );
  };

  return { onSubmit, isSubmitting };
};
