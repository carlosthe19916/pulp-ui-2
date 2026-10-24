import type { IPlugin } from "@catalog";
import { useNotifications } from "@app/hooks/useNotifications";
import type {
  IEntityForEdit,
  IUseEntityFormResult,
} from "@app/hooks/pluginForm/useEntityForm";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  useRemoteCreateMutation,
  useRemoteUpdateMutation,
} from "@app/queries/remotes";
import { getMutationErrorMessage } from "@app/utils/utils";

import { valuesToCreate, valuesToPatch } from "../components/RemoteForm";

interface IUseRemoteFormArgs {
  plugin: IPlugin | undefined;
  /** The full (detail-fetched) entity in edit mode; undefined ⇒ create. */
  entity?: IEntityForEdit;
  onClose: () => void;
}

/**
 * Remote create/edit form: maps form values to a remote write body (`RemoteForm`)
 * and runs the family's create/update mutations. The success toast is raised from
 * the mutations' hook-level callbacks and the call-level `onSuccess` closes the
 * modal (see `.rulesync/rules/toastr.md`); a submission failure is shown in-form via
 * `submitError`, not a toast (see `.rulesync/rules/forms.md`).
 */
export const useRemoteForm = ({
  plugin,
  entity,
  onClose,
}: IUseRemoteFormArgs): IUseEntityFormResult => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const isCreate = !entity;
  const entityPlugin = plugin?.entities.remote;

  const createMutation = useRemoteCreateMutation({
    onSuccess: (data) =>
      addNotification({
        title: `Remote "${data.name}" created`,
        variant: "success",
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({ error, fallback: "Failed to create remote" }),
      ),
  });
  const updateMutation = useRemoteUpdateMutation({
    onSuccess: () =>
      addNotification({
        title: `Remote "${entity?.name}" updated`,
        variant: "success",
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({ error, fallback: "Failed to update remote" }),
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
          body: valuesToPatch(values),
        },
        { onSuccess: () => onClose() },
      );
    }
  };

  return { onSubmit, isSubmitting, submitError };
};
