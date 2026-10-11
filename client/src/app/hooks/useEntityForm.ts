import { useForm, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import type { IEntityField, IPlugin } from "@catalog";
import {
  buildDefaultValues,
  buildFieldSchema,
} from "@app/components/Entity/formSchema";
import type { IContentFamilyConfig } from "@app/queries/utils/families";
import { useEntitySubmit } from "@app/hooks/useEntitySubmit";

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

  const { submit, isSubmitting } = useEntitySubmit({
    config,
    plugin,
    entity,
    onClose,
  });

  const onSubmit = form.handleSubmit(submit);

  return {
    form,
    isCreate,
    fields,
    onSubmit,
    isSubmitting: form.formState.isSubmitting || isSubmitting,
  };
};
