import type { IPlugin } from "@catalog";
import {
  type IEntityForEdit,
  type IUseEntityFormResult,
} from "@app/hooks/pluginForm/useEntityForm";

import { valuesToCreate, valuesToPatch } from "../components/DistributionForm";
import { useDistributionActions } from "./useDistributionActions";

interface IUseDistributionFormArgs {
  plugin: IPlugin | undefined;
  entity?: IEntityForEdit;
  onClose: () => void;
}

/**
 * Distribution create/edit form (mirrors `useRepositoryForm`): a values-based submit
 * that maps the form values to a distribution write body (`DistributionForm`) and
 * runs the family's actions. The body (plain or wizard) owns the form itself.
 */
export const useDistributionForm = ({
  plugin,
  entity,
  onClose,
}: IUseDistributionFormArgs): IUseEntityFormResult => {
  const isCreate = !entity;
  const { createDistribution, updateDistribution, isSubmitting } =
    useDistributionActions();

  const entityPlugin = plugin?.entities.distribution;

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      if (isCreate) {
        if (!entityPlugin) return;
        await createDistribution(entityPlugin.apiPath, valuesToCreate(values));
      } else if (entity?.pulp_href) {
        await updateDistribution(
          entity.pulp_href,
          entity.name,
          valuesToPatch(values),
        );
      } else {
        return;
      }
      onClose();
    } catch {
      // Toast raised in useDistributionActions; keep the modal open.
    }
  };

  return { onSubmit, isSubmitting };
};
