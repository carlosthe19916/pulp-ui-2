import { type ReactNode, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Form } from "@patternfly/react-core";

import type { EntityType } from "@catalog";
import { EntityFormFields } from "@app/components/EntityFormFields";
import { buildFieldSchema } from "@app/components/Entity/formSchema";
import type { IFieldGroup } from "@app/components/Entity/wizardSteps";
import { slugifyGroup } from "@app/components/Entity/wizardSteps";
import type { ITypeaheadOption } from "@app/components/TypeaheadSelect";
import {
  type IFormStepState,
  useFormChangeHandler,
} from "@app/hooks/useFormChangeHandler";

type StepFormValues = Record<string, unknown>;

interface IEntityWizardStepProps {
  step: IFieldGroup;
  /** Seed values held by the parent, so inputs restore when the step remounts. */
  initialValues: StepFormValues;
  onStateChanged: (state: IFormStepState<StepFormValues>) => void;
  resourceOptions: Partial<Record<EntityType, ITypeaheadOption[]>>;
  /** Rendered above the fields on the first step (create type picker). */
  typeSelector?: ReactNode;
}

/**
 * One wizard step: a react-hook-form over just this group's fields that validates
 * on change/blur and lifts its validity to the parent, which gates navigation.
 */
export const EntityWizardStep = ({
  step,
  initialValues,
  onStateChanged,
  resourceOptions,
  typeSelector,
}: IEntityWizardStepProps) => {
  const form = useForm<StepFormValues>({
    mode: "all",
    resolver: yupResolver(buildFieldSchema(step.fields)),
    defaultValues: initialValues,
  });

  useFormChangeHandler({ form, onStateChanged });

  // Validate on mount so `isValid`/errors reflect the seeded values immediately.
  useEffect(() => {
    void form.trigger();
  }, [form]);

  const idPrefix = `entity-wizard-${slugifyGroup(step.group)}`;

  return (
    <Form id={idPrefix} onSubmit={(e) => e.preventDefault()}>
      {typeSelector}
      <EntityFormFields
        fields={step.fields}
        control={form.control}
        idPrefix={idPrefix}
        resourceOptions={resourceOptions}
      />
    </Form>
  );
};
