import { useForm, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { getEntityLabel } from "@catalog";
import type { IEntityField, IPlugin } from "@catalog";
import {
  buildDefaultValues,
  buildFieldSchema,
  cleanFormValues,
} from "@app/components/Entity/formSchema";
import { useNotifications } from "@app/context/useNotifications";
import type { IContentFamilyConfig } from "@app/queries/utils/families";
import {
  useEntityCreateMutation,
  useEntityUpdateMutation,
} from "@app/queries/utils/entityCrud";
import { getMutationErrorMessage } from "@app/utils/utils";

type EntityFormValues = Record<string, unknown>;

export interface IEntityForEdit {
  pulp_href?: string;
  name?: string;
  [key: string]: unknown;
}

interface IUseEntityFormArgs {
  config: IContentFamilyConfig;
  /** Resolved plugin for the selected/edited pulp_type (undefined ⇒ no fields). */
  plugin: IPlugin | undefined;
  /** Present ⇒ edit mode. */
  entity?: IEntityForEdit;
  onClose: () => void;
}

export interface IUseEntityFormResult {
  form: UseFormReturn<EntityFormValues>;
  isCreate: boolean;
  fields: IEntityField[];
  onSubmit: () => void;
  isSubmitting: boolean;
}

/**
 * Generic create/edit form for any content family + plugin type. The plugin's
 * resolved `form` fields already include the shared base fields. Create posts to
 * the plugin's endpoint; edit PATCHes the entity's `pulp_href`.
 */
export const useEntityForm = ({
  config,
  plugin,
  entity,
  onClose,
}: IUseEntityFormArgs): IUseEntityFormResult => {
  const isCreate = !entity;
  const { addNotification } = useNotifications();
  const createMutation = useEntityCreateMutation(
    config.family,
    config.rootQueryKey,
  );
  const updateMutation = useEntityUpdateMutation(config.rootQueryKey);
  const label = getEntityLabel(config.kind);

  // The plugin's contribution for this family (form fields + create endpoint).
  const entityPlugin = plugin?.entities[config.kind];

  // Fields are fixed for this mount: the modal remounts (via `key`) when the
  // create type changes, so no memo/reset dance is needed here.
  const fields =
    (isCreate
      ? entityPlugin?.form.createFields
      : entityPlugin?.form.editFields) ?? [];

  const form = useForm<EntityFormValues>({
    resolver: yupResolver(buildFieldSchema(fields)),
    defaultValues: buildDefaultValues(fields, entity),
    mode: "onChange",
  });

  const onSubmit = form.handleSubmit(async (values) => {
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
  });

  return {
    form,
    isCreate,
    fields,
    onSubmit,
    isSubmitting:
      form.formState.isSubmitting ||
      createMutation.isPending ||
      updateMutation.isPending,
  };
};
