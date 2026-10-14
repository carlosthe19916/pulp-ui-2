import type { IPlugin } from "@catalog";
import type {
  IEntityForEdit,
  IUseEntityFormResult,
} from "@app/hooks/pluginForm/useEntityForm";

import { valuesToCreate, valuesToPatch } from "../components/RemoteForm";
import { useRemoteActions } from "./useRemoteActions";

interface IUseRemoteFormArgs {
  plugin: IPlugin | undefined;
  /** The full (detail-fetched) entity in edit mode; undefined ⇒ create. */
  entity?: IEntityForEdit;
  onClose: () => void;
}

/**
 * Remote create/edit form: a values-based submit + pending state that maps the form
 * values to a remote write body (`RemoteForm`) and runs the family's actions. Create
 * POSTs to the selected plugin type's endpoint; edit PATCHes the `pulp_href`. The
 * body (wizard today) owns the form itself.
 */
export const useRemoteForm = ({
  plugin,
  entity,
  onClose,
}: IUseRemoteFormArgs): IUseEntityFormResult => {
  const isCreate = !entity;
  const { createRemote, updateRemote, isSubmitting } = useRemoteActions();
  const entityPlugin = plugin?.entities.remote;

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      if (isCreate) {
        if (!entityPlugin) return;
        await createRemote(entityPlugin.apiPath, valuesToCreate(values));
      } else if (entity?.pulp_href) {
        await updateRemote(
          entity.pulp_href,
          entity.name,
          valuesToPatch(values),
        );
      } else {
        return;
      }
      onClose();
    } catch {
      // Toast raised in useRemoteActions; keep the modal open.
    }
  };

  return { onSubmit, isSubmitting };
};
