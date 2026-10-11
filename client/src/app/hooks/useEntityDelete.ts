import { getEntityLabel } from "@catalog";
import type { IContentFamilyConfig } from "@app/queries/utils/families";
import { useMutationAction } from "@app/hooks/useMutationAction";
import { useEntityDeleteMutation } from "@app/queries/utils/entityCrud";

interface IDeletableEntity {
  name: string;
  pulp_href: string;
}

/**
 * Generic, plugin-agnostic delete for any content family. Deletes by the
 * entity's `pulp_href` (which embeds plugin+type), with task/success/failure
 * toasts. Rethrows so a modal can stay open on failure.
 */
export const useEntityDelete = (config: IContentFamilyConfig) => {
  const { runAction } = useMutationAction();
  const deleteMutation = useEntityDeleteMutation(config.rootQueryKey);
  const label = getEntityLabel(config.kind);

  const deleteEntity = async (entity: IDeletableEntity) =>
    runAction(() => deleteMutation.mutateAsync(entity.pulp_href ?? ""), {
      taskAware: true,
      taskTitle: `${label} "${entity.name}" delete started`,
      successTitle: `${label} "${entity.name}" deleted`,
      errorTitle: `Failed to delete ${label.toLowerCase()}`,
    });

  return {
    deleteEntity,
    isDeleting: deleteMutation.isPending,
  };
};
