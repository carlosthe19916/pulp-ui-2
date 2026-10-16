import { type ReactNode, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Form } from "@patternfly/react-core";

import { EntityFormFields } from "@app/components/EntityFormFields";
import { FormSubmitError } from "@app/components/FormSubmitError";
import { buildFieldSchema } from "@app/components/PluginForm/formSchema";
import type { ResourceFilterMap } from "@app/components/PluginForm/resourceFilter";
import type { IFieldGroup } from "@app/components/PluginForm/wizardSteps";
import { slugifyGroup } from "@app/components/PluginForm/wizardSteps";
import {
  type IFormStepState,
  useFormChangeHandler,
} from "@app/hooks/useFormChangeHandler";
import type { IMutationErrorMessage } from "@app/utils/utils";

type StepFormValues = Record<string, unknown>;

interface IEntityWizardStepProps {
  step: IFieldGroup;
  /** Seed values held by the parent, so inputs restore when the step remounts. */
  initialValues: StepFormValues;
  onStateChanged: (state: IFormStepState<StepFormValues>) => void;
  resourceFilter: ResourceFilterMap;
  /** Rendered above the fields on the first step (create type picker). */
  typeSelector?: ReactNode;
  /** Submission failure, set only on the final (submitting) step; null otherwise. */
  submitError?: IMutationErrorMessage | null;
}

/**
 * One wizard step: a react-hook-form over just this group's fields that validates
 * on change/blur and lifts its validity to the parent, which gates navigation.
 */
export const EntityWizardStep = ({
  step,
  initialValues,
  onStateChanged,
  resourceFilter,
  typeSelector,
  submitError = null,
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
      <FormSubmitError error={submitError} />
      {typeSelector}
      <EntityFormFields
        fields={step.fields}
        control={form.control}
        idPrefix={idPrefix}
        resourceFilter={resourceFilter}
      />
    </Form>
  );
};
