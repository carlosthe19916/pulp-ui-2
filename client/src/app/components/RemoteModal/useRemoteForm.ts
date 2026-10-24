import type { IPlugin } from "@catalog";

import type {
  IEntityForEdit,
  IUseEntityFormResult,
} from "@app/hooks/pluginForm/useEntityForm";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  useRemoteCreateMutation,
  useRemoteUpdateMutation,
} from "@app/queries/remotes";
import { getMutationErrorMessage } from "@app/utils/utils";

import { valuesToCreate, valuesToPatch } from "./remoteForm";

interface IUseRemoteFormOptions {
  plugin: IPlugin | undefined;
  /** The full (detail-fetched) entity in edit mode; undefined ⇒ create. */
  entity?: IEntityForEdit;
  onClose: () => void;
}

/**
 * Remote create/edit form: maps values to a remote write body and runs the create/update
 * mutations; failures show in-form via `submitError`.
 */
export const useRemoteForm = ({
  plugin,
  entity,
  onClose,
}: IUseRemoteFormOptions): IUseEntityFormResult => {
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
