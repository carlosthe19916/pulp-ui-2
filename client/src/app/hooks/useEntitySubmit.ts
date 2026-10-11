import { getEntityLabel } from "@catalog";
import type { IPlugin } from "@catalog";
import { cleanFormValues } from "@app/components/Entity/formSchema";
import { useNotifications } from "@app/context/useNotifications";
import type { IContentFamilyConfig } from "@app/queries/utils/families";
import {
  useEntityCreateMutation,
  useEntityUpdateMutation,
} from "@app/queries/utils/entityCrud";
import type { IEntityForEdit } from "@app/hooks/useEntityForm";
import { getMutationErrorMessage } from "@app/utils/utils";

interface IUseEntitySubmitArgs {
  config: IContentFamilyConfig;
  /** Resolved plugin for the selected/edited pulp_type (undefined ⇒ no create). */
  plugin: IPlugin | undefined;
  /** Present ⇒ edit mode. */
  entity?: IEntityForEdit;
  onClose: () => void;
}

export interface IUseEntitySubmitResult {
  submit: (values: Record<string, unknown>) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Shared create/edit submit for any content family. Create posts to the plugin's
 * endpoint; edit PATCHes the entity's `pulp_href`. The plain form and the wizard
 * both feed it a flat values object, keeping payload and notifications identical.
 */
export const useEntitySubmit = ({
  config,
  plugin,
  entity,
  onClose,
}: IUseEntitySubmitArgs): IUseEntitySubmitResult => {
  const isCreate = !entity;
  const { addNotification } = useNotifications();
  const createMutation = useEntityCreateMutation(
    config.family,
    config.rootQueryKey,
  );
  const updateMutation = useEntityUpdateMutation(config.rootQueryKey);
  const label = getEntityLabel(config.kind);

  const entityPlugin = plugin?.entities[config.kind];

  const submit = async (values: Record<string, unknown>) => {
    try {
      if (isCreate) {
        if (!entityPlugin) return;
        const body = cleanFormValues(values);
        const result = await createMutation.mutateAsync({
          apiPath: entityPlugin.apiPath,
          body,
        });
        const createdName =
          (result as { name?: string } | undefined)?.name ??
          (values.name as string | undefined);
        addNotification({
          title: createdName
            ? `${label} "${createdName}" created`
            : `${label} create started`,
          variant: "success",
        });
      } else if (entity?.pulp_href) {
        await updateMutation.mutateAsync({
          href: entity.pulp_href,
          body: cleanFormValues(values),
        });
        addNotification({
          title: `${label} "${entity.name}" updated`,
          variant: "success",
        });
      } else {
        return;
      }
      onClose();
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(
          error,
          isCreate
            ? `Failed to create ${label.toLowerCase()}`
            : `Failed to update ${label.toLowerCase()}`,
        ),
        variant: "danger",
      });
    }
  };

  return {
    submit,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  };
};
