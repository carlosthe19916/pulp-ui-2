import type { IPlugin } from "@catalog";
import { useNotifications } from "@app/context/useNotifications";
import type {
  IEntityForEdit,
  IUseEntityFormResult,
} from "@app/hooks/pluginForm/useEntityForm";
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
 * and runs the family's create/update mutations. Toasts are raised from the
 * mutations' hook-level callbacks (survive unmount); the call-level `onSuccess`
 * closes the modal on success only (see `evals/toastr.md`).
 */
export const useRemoteForm = ({
  plugin,
  entity,
  onClose,
}: IUseRemoteFormArgs): IUseEntityFormResult => {
  const { addNotification } = useNotifications();
  const isCreate = !entity;
  const entityPlugin = plugin?.entities.remote;

  const createMutation = useRemoteCreateMutation({
    onSuccess: (data) =>
      addNotification({
        title: `Remote "${data.name}" created`,
        variant: "success",
      }),
    onError: (error) =>
      addNotification({
        ...getMutationErrorMessage(error, "Failed to create remote"),
        variant: "danger",
      }),
  });
  const updateMutation = useRemoteUpdateMutation({
    onSuccess: (_data, { name }) =>
      addNotification({
        title: `Remote "${name}" updated`,
        variant: "success",
      }),
    onError: (error) =>
      addNotification({
        ...getMutationErrorMessage(error, "Failed to update remote"),
        variant: "danger",
      }),
  });
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: Record<string, unknown>) => {
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

  return { onSubmit, isSubmitting };
};
