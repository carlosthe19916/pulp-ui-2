import type { IPlugin } from "@catalog";

import {
  type IEntityForEdit,
  type IUseEntityFormResult,
} from "@app/hooks/pluginForm/useEntityForm";
import { useNotifications } from "@app/hooks/useNotifications";
import { usePendingCreateRecorder } from "@app/hooks/usePendingCreateRecorder";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  useDistributionCreateMutation,
  useDistributionUpdateMutation,
} from "@app/queries/distributions";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { valuesToCreate, valuesToPatch } from "./distributionForm";

interface IUseDistributionFormOptions {
  plugin: IPlugin | undefined;
  entity?: IEntityForEdit;
  onClose: () => void;
}

/**
 * Distribution create/edit form: maps values to a write body and runs the create (async,
 * 202 + task) / update mutations; failures show in-form.
 */
export const useDistributionForm = ({
  plugin,
  entity,
  onClose,
}: IUseDistributionFormOptions): IUseEntityFormResult => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const { recordPendingCreate } = usePendingCreateRecorder({
    entityType: "distribution",
  });
  const isCreate = !entity;
  const entityPlugin = plugin?.entities.distribution;

  const createMutation = useDistributionCreateMutation({
    onSuccess: (data, { body }) => {
      const name = String(body.name ?? "");
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: `Distribution "${name}" create started`,
      });
      recordPendingCreate({ taskHref: data.task, name });
    },
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: "Failed to create distribution",
        }),
      ),
  });
  const updateMutation = useDistributionUpdateMutation({
    onSuccess: () =>
      addNotification({
        title: `Distribution "${entity?.name}" updated`,
        variant: "success",
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: "Failed to update distribution",
        }),
      ),
  });
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: Record<string, unknown>) => {
    clearSubmitError();
    if (isCreate) {
      if (!entityPlugin) return;
      const body = valuesToCreate(values);
      createMutation.mutate(
        { apiPath: entityPlugin.apiPath, body },
        { onSuccess: () => onClose() },
      );
    } else if (entity?.pulp_href) {
      updateMutation.mutate(
        {
          href: entity.pulp_href,
          body: valuesToPatch(values),
        },
        { onSuccess: () => onClose() },
      );
    }
  };

  return { onSubmit, isSubmitting, submitError };
};
