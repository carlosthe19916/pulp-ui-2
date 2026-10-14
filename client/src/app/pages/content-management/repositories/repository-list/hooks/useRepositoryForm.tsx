import type { IPlugin } from "@catalog";
import {
  type IEntityForEdit,
  type IUseEntityFormResult,
} from "@app/hooks/pluginForm/useEntityForm";

import { valuesToCreate, valuesToPatch } from "../components/RepositoryForm";
import { useRepositoryActions } from "./useRepositoryActions";

interface IUseRepositoryFormArgs {
  /** Resolved plugin for the selected/edited pulp_type (undefined ⇒ no fields). */
  plugin: IPlugin | undefined;
  /** Present ⇒ edit mode. */
  entity?: IEntityForEdit;
  onClose: () => void;
}

/**
 * Repository create/edit form (mirrors `useUserForm`): a values-based submit that
 * maps the form values to a repository write body (`RepositoryForm`) and runs the
 * family's actions. Create POSTs to the selected plugin type's endpoint; edit
 * PATCHes the `pulp_href`. The body (plain or wizard) owns the form itself.
 */
export const useRepositoryForm = ({
  plugin,
  entity,
  onClose,
}: IUseRepositoryFormArgs): IUseEntityFormResult => {
  const isCreate = !entity;
  const { createRepository, updateRepository, isSubmitting } =
    useRepositoryActions();

  const entityPlugin = plugin?.entities.repository;

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      if (isCreate) {
        if (!entityPlugin) return;
        await createRepository(entityPlugin.apiPath, valuesToCreate(values));
      } else if (entity?.pulp_href) {
        await updateRepository(
          entity.pulp_href,
          entity.name,
          valuesToPatch(values),
        );
      } else {
        return;
      }
      onClose();
    } catch {
      // Toast raised in useRepositoryActions; keep the modal open.
    }
  };

  return { onSubmit, isSubmitting };
};
