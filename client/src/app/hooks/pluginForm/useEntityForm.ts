import { useForm, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import type { EntityType, IEntityField, IPlugin } from "@catalog";
import {
  buildDefaultValues,
  buildFieldSchema,
} from "@app/components/PluginForm/formSchema";
import type { IMutationErrorMessage } from "@app/utils/utils";

type EntityFormValues = Record<string, unknown>;

export interface IEntityForEdit {
  pulp_href?: string;
  name?: string;
  [key: string]: unknown;
}

interface IUseEntityFormBaseArgs {
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
 * The shared, plugin-neutral form builder reused by every family's form hook
 * (e.g. `useRepositoryForm`): it reads the catalog's field descriptors for the
 * `kind` + plugin and returns a configured react-hook-form (resolver + defaults)
 * and the resolved field list, with **no submit wiring** — each family injects its
 * own typed submit via its actions hook.
 *
 * Fields are fixed for this mount: the modal remounts (via `key`) when the create
 * type changes, so no memo/reset dance is needed here.
 */
export const useEntityFormBase = ({
  kind,
  plugin,
  entity,
}: IUseEntityFormBaseArgs): IUseEntityFormBaseResult => {
  const isCreate = !entity;

  // The plugin's contribution for this family (form fields + create endpoint).
  const entityPlugin = plugin?.entities[kind];

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
 * What every family's form hook returns: a values-based submit (create or edit) plus
 * pending state. The plain body wraps it in `form.handleSubmit`; the wizard body
 * calls it with the merged step values.
 */
export interface IUseEntityFormResult {
  // Submit the (create or edit) values. The success toast + call-level onSuccess
  // close the modal (see `evals/toastr.md`); a submission failure is surfaced
  // in-form via `submitError`, not a toast (see `evals/forms.md`).
  onSubmit: (values: Record<string, unknown>) => void;
  isSubmitting: boolean;
  /** Submission failure to render at the top of the form; null when none. */
  submitError: IMutationErrorMessage | null;
}
