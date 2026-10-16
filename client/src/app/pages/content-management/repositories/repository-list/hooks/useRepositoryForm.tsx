import type { IPlugin } from "@catalog";
import { useNotifications } from "@app/context/useNotifications";
import {
  type IEntityForEdit,
  type IUseEntityFormResult,
} from "@app/hooks/pluginForm/useEntityForm";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  useRepositoryCreateMutation,
  useRepositoryUpdateMutation,
} from "@app/queries/repositories";
import { getMutationErrorMessage } from "@app/utils/utils";

import { valuesToCreate, valuesToPatch } from "../components/RepositoryForm";

interface IUseRepositoryFormArgs {
  /** Resolved plugin for the selected/edited pulp_type (undefined ⇒ no fields). */
  plugin: IPlugin | undefined;
  /** Present ⇒ edit mode. */
  entity?: IEntityForEdit;
  onClose: () => void;
}

/**
 * Repository create/edit form: maps form values to a repository write body
 * (`RepositoryForm`) and runs the family's create/update mutations. The success
 * toast is raised from the mutations' hook-level callbacks and the call-level
 * `onSuccess` closes the modal (see `evals/toastr.md`); a submission failure is
 * shown in-form via `submitError`, not a toast (see `evals/forms.md`).
 */
export const useRepositoryForm = ({
  plugin,
  entity,
  onClose,
}: IUseRepositoryFormArgs): IUseEntityFormResult => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const isCreate = !entity;
  const entityPlugin = plugin?.entities.repository;

  const createMutation = useRepositoryCreateMutation({
    onSuccess: (data) =>
      addNotification({
        title: `Repository "${data.name}" created`,
        variant: "success",
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: "Failed to create repository",
        }),
      ),
  });
  const updateMutation = useRepositoryUpdateMutation({
    onSuccess: (_data, { name }) =>
      addNotification({
        title: `Repository "${name}" updated`,
        variant: "success",
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: "Failed to update repository",
        }),
      ),
  });
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: Record<string, unknown>) => {
    clearSubmitError();
    if (isCreate) {
      if (!entityPlugin) return;
      createMutation.mutate(
        { apiPath: entityPlugin.apiPath, body: valuesToCreate(values) },
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
