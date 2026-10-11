import { type ReactNode } from "react";

import { Form, Wizard, WizardHeader, WizardStep } from "@patternfly/react-core";

import type { EntityType, IEntityField, IPlugin } from "@catalog";
import { EntityFormFields } from "@app/components/EntityFormFields";
import type { ITypeaheadOption } from "@app/components/TypeaheadSelect";
import type { IContentFamilyConfig } from "@app/queries/utils/families";
import { useEntityForm, type IEntityForEdit } from "@app/hooks/useEntityForm";

const FORM_ID = "entity-wizard-form";
const CATCH_ALL_GROUP = "Options";

interface IFieldGroup {
  group: string;
  fields: IEntityField[];
}

/** Split fields into ordered groups (first-appearance order); ungrouped last. */
const groupFields = (fields: IEntityField[]): IFieldGroup[] => {
  const order: string[] = [];
  const byGroup = new Map<string, IEntityField[]>();
  for (const field of fields) {
    const group = field.group ?? CATCH_ALL_GROUP;
    if (!byGroup.has(group)) {
      byGroup.set(group, []);
      order.push(group);
    }
    byGroup.get(group)?.push(field);
  }
  return order.map((group) => ({ group, fields: byGroup.get(group) ?? [] }));
};

const slug = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

interface IEntityWizardBodyProps {
  config: IContentFamilyConfig;
  plugin: IPlugin | undefined;
  entity?: IEntityForEdit;
  onClose: () => void;
  title: string;
  typeSelector?: ReactNode;
  resourceOptions: Partial<Record<EntityType, ITypeaheadOption[]>>;
}

/**
 * Multi-step wizard variant of the entity form, for large grouped field sets
 * (remotes). Steps come from the fields' `group`. Navigation is free (default
 * Back/Next); the last step's button submits, and react-hook-form validates the
 * whole form on submit (required fields live on the first or last step).
 */
export const EntityWizardBody = ({
  config,
  plugin,
  entity,
  onClose,
  title,
  typeSelector,
  resourceOptions,
}: IEntityWizardBodyProps) => {
  const { form, isCreate, fields, onSubmit, isSubmitting } = useEntityForm({
    config,
    plugin,
    entity,
    onClose,
  });

  const steps = groupFields(fields);
  const submitLabel = isCreate ? "Create" : "Save";

  return (
    <Wizard
      header={<WizardHeader title={title} onClose={onClose} />}
      onClose={onClose}
      height={520}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <WizardStep
            key={step.group}
            name={step.group}
            id={`entity-wizard-${slug(step.group)}`}
            footer={
              isLast
                ? {
                    nextButtonText: submitLabel,
                    onNext: () => onSubmit(),
                    isNextDisabled: isSubmitting,
                  }
                : undefined
            }
          >
            <Form id={FORM_ID} onSubmit={(e) => e.preventDefault()}>
              {index === 0 && typeSelector}
              <EntityFormFields
                fields={step.fields}
                control={form.control}
                idPrefix={FORM_ID}
                resourceOptions={resourceOptions}
              />
            </Form>
          </WizardStep>
        );
      })}
    </Wizard>
  );
};
