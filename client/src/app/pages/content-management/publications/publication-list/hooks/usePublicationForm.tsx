import type { IPlugin } from "@catalog";
import { type IUseEntityFormResult } from "@app/hooks/pluginForm/useEntityForm";

import { valuesToCreate } from "../components/PublicationForm";
import { usePublicationActions } from "./usePublicationActions";

interface IUsePublicationFormArgs {
  plugin: IPlugin | undefined;
  onClose: () => void;
}

/**
 * Publication create form (create-only — publications are immutable): a values-based
 * submit that maps the form values to a publication write body (`PublicationForm`)
 * and runs the family's create action. The body owns the form itself.
 */
export const usePublicationForm = ({
  plugin,
  onClose,
}: IUsePublicationFormArgs): IUseEntityFormResult => {
  const { createPublication, isSubmitting } = usePublicationActions();

  const entityPlugin = plugin?.entities.publication;

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      if (!entityPlugin) return;
      await createPublication(entityPlugin.apiPath, valuesToCreate(values));
      onClose();
    } catch {
      // Toast raised in usePublicationActions; keep the modal open.
    }
  };

  return { onSubmit, isSubmitting };
};
