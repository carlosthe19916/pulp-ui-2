import { useForm, type UseFormReturn } from "react-hook-form";

import type { EntityType, IEntityField, IPlugin } from "@catalog";
import { yupResolver } from "@hookform/resolvers/yup";

import { buildDefaultValues, buildFieldSchema } from "@app/utils/formSchema";
import type { IMutationErrorMessage } from "@app/utils/utils";

type EntityFormValues = Record<string, unknown>;

export interface IEntityForEdit {
  pulp_href?: string;
  name?: string;
  [key: string]: unknown;
}

interface IUseEntityFormBaseOptions {
  /** The content entity type (catalog key) this form is for. */
  kind: EntityType;
  /** Resolved plugin for the selected/edited pulp_type (undefined ⇒ no fields). */
  plugin: IPlugin | undefined;
  /** Present ⇒ edit mode. */
  entity?: IEntityForEdit;
}

export interface IUseEntityFormBaseResult {
  form: UseFormReturn<EntityFormValues>;
  isCreate: boolean;
  fields: IEntityField[];
}

/**
 * Plugin-neutral form builder for every family's form hook: catalog fields to a
 * configured react-hook-form, with no submit wiring.
 */
export const useEntityFormBase = ({
  kind,
  plugin,
  entity,
}: IUseEntityFormBaseOptions): IUseEntityFormBaseResult => {
  const isCreate = !entity;

  const entityPlugin = plugin?.entities[kind];

  // Fixed for this mount: the modal remounts (via `key`) when the create type changes.
  const fields =
    (isCreate
      ? entityPlugin?.form.createFields
      : entityPlugin?.form.editFields) ?? [];

  const form = useForm<EntityFormValues>({
    resolver: yupResolver(buildFieldSchema(fields)),
    defaultValues: buildDefaultValues({ fields, source: entity }),
    mode: "onChange",
  });

  return { form, isCreate, fields };
};

/**
 * What every family's form hook returns. The plain body wraps `onSubmit` in
 * `form.handleSubmit`; the wizard calls it with the merged step values.
 */
export interface IUseEntityFormResult {
  // Submit the (create or edit) values. The success toast + call-level onSuccess
  // close the modal (see `.rulesync/rules/toastr.md`); a submission failure is surfaced
  // in-form via `submitError`, not a toast (see `.rulesync/rules/forms.md`).
  onSubmit: (values: Record<string, unknown>) => void;
  isSubmitting: boolean;
  /** Submission failure to render at the top of the form; null when none. */
  submitError: IMutationErrorMessage | null;
}
