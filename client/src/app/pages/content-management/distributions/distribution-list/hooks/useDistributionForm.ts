import type { IPlugin } from "@catalog";
import { useNotifications } from "@app/context/useNotifications";
import {
  type IEntityForEdit,
  type IUseEntityFormResult,
} from "@app/hooks/pluginForm/useEntityForm";
import { usePendingCreateRecorder } from "@app/hooks/usePendingCreateRecorder";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  useDistributionCreateMutation,
  useDistributionUpdateMutation,
} from "@app/queries/distributions";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { valuesToCreate, valuesToPatch } from "../components/DistributionForm";

interface IUseDistributionFormArgs {
  plugin: IPlugin | undefined;
  entity?: IEntityForEdit;
  onClose: () => void;
}

/**
 * Distribution create/edit form: maps form values to a distribution write body
 * (`DistributionForm`) and runs the family's create/update mutations. Create is
 * async (202 + task). The success toast is raised from the mutations' hook-level
 * callbacks and the call-level `onSuccess` closes the modal (see `evals/toastr.md`);
 * a submission failure is shown in-form via `submitError`, not a toast (see
 * `evals/forms.md`).
 */
export const useDistributionForm = ({
  plugin,
  entity,
  onClose,
}: IUseDistributionFormArgs): IUseEntityFormResult => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const { recordPendingCreate } = usePendingCreateRecorder({
    entityType: "distribution",
  });
  const isCreate = !entity;
  const entityPlugin = plugin?.entities.distribution;

  const createMutation = useDistributionCreateMutation({
    onSuccess: (data, { name }) => {
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
    onSuccess: (_data, { name }) =>
      addNotification({
        title: `Distribution "${name}" updated`,
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
        { apiPath: entityPlugin.apiPath, name: body.name ?? "", body },
        { onSuccess: () => onClose() },
      );
    } else if (entity?.pulp_href) {
      updateMutation.mutate(
        {
          href: entity.pulp_href,
          name: entity.name ?? "",
          body: valuesToPatch(values),
        },
        { onSuccess: () => onClose() },
      );
    }
  };

  return { onSubmit, isSubmitting, submitError };
};
