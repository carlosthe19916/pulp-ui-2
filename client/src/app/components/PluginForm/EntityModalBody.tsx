import { type ReactNode } from "react";

import type { EntityType, IPlugin } from "@catalog";
import { EntityFormBody } from "@app/components/PluginForm/EntityFormBody";
import { EntityWizardBody } from "@app/components/PluginForm/EntityWizardBody";
import {
  buildResourceFilter,
  type ResourceFilterMap,
} from "@app/components/PluginForm/resourceFilter";
import {
  useEntityFormBase,
  type IEntityForEdit,
} from "@app/hooks/pluginForm/useEntityForm";
import type { IMutationErrorMessage } from "@app/utils/utils";

interface IEntityModalBodyProps {
  kind: EntityType;
  plugin: IPlugin | undefined;
  entity?: IEntityForEdit;
  /** Catalog-driven: render the multi-step wizard vs the plain form. */
  useWizard: boolean;
  title: string;
  typeSelector?: ReactNode;
  onClose: () => void;
  /** Family-supplied, mode-agnostic submit for the (create or edit) values. */
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  isSubmitting: boolean;
  /** Submission failure shown at the top of the form (see `.rulesync/rules/forms.md`). */
  submitError: IMutationErrorMessage | null;
}

interface IPlainEntityFormBodyProps extends Omit<
  IEntityModalBodyProps,
  "useWizard" | "title"
> {
  resourceFilter: ResourceFilterMap;
}

/** Plain-form path: owns the single react-hook-form and wraps the family submit. */
const PlainEntityFormBody = ({
  kind,
  plugin,
  entity,
  typeSelector,
  onClose,
  onSubmit,
  isSubmitting,
  resourceFilter,
  submitError,
}: IPlainEntityFormBodyProps) => {
  const { form, isCreate, fields } = useEntityFormBase({
    kind,
    plugin,
    entity,
  });

  return (
    <EntityFormBody
      form={form}
      fields={fields}
      isCreate={isCreate}
      onSubmit={form.handleSubmit(onSubmit)}
      isSubmitting={form.formState.isSubmitting || isSubmitting}
      hasPlugin={!!plugin}
      onClose={onClose}
      typeSelector={typeSelector}
      resourceFilter={resourceFilter}
      submitError={submitError}
    />
  );
};

/**
 * Picks the form body from the catalog's `isWizard` (sibling of `EntityModalShell`,
 * which owns the chrome). It calls no hooks itself — each branch's hooks live in a
 * mounted sub-component — so the switch is safe. The caller must `key` it to remount
 * when the create type (and thus `useWizard`) or edited entity changes.
 */
export const EntityModalBody = ({
  kind,
  plugin,
  entity,
  useWizard,
  title,
  typeSelector,
  onClose,
  onSubmit,
  isSubmitting,
  submitError,
}: IEntityModalBodyProps) => {
  const resourceFilter = buildResourceFilter({ kind, plugin });

  if (useWizard) {
    return (
      <EntityWizardBody
        kind={kind}
        plugin={plugin}
        entity={entity}
        onClose={onClose}
        title={title}
        typeSelector={typeSelector}
        resourceFilter={resourceFilter}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    );
  }

  return (
    <PlainEntityFormBody
      kind={kind}
      plugin={plugin}
      entity={entity}
      typeSelector={typeSelector}
      onClose={onClose}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      resourceFilter={resourceFilter}
      submitError={submitError}
    />
  );
};
