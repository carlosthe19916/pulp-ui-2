import { type ReactNode } from "react";

import { Wizard, WizardHeader, WizardStep } from "@patternfly/react-core";

import type { EntityType, IPlugin } from "@catalog";
import { EntityWizardStep } from "@app/components/PluginForm/EntityWizardStep";
import type { ResourceFilterMap } from "@app/components/PluginForm/resourceFilter";
import { useEntityWizardState } from "@app/components/PluginForm/useEntityWizardState";
import {
  groupFields,
  slugifyGroup,
} from "@app/components/PluginForm/wizardSteps";
import type { IEntityForEdit } from "@app/hooks/pluginForm/useEntityForm";
import type { IMutationErrorMessage } from "@app/utils/utils";

interface IEntityWizardBodyProps {
  kind: EntityType;
  plugin: IPlugin | undefined;
  entity?: IEntityForEdit;
  onClose: () => void;
  title: string;
  typeSelector?: ReactNode;
  resourceFilter: ResourceFilterMap;
  /** Family-supplied submit for the merged step values (create or edit). */
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  isSubmitting: boolean;
  /** Submission failure shown on the final (submitting) step (see `.rulesync/rules/forms.md`). */
  submitError: IMutationErrorMessage | null;
}

/**
 * Multi-step wizard variant of the entity form, for large grouped field sets
 * (remotes). Steps come from the fields' `group`; each is an independent form whose
 * validity gates Next. The last step submits merged values once every step is valid.
 * Submission itself is owned by the family (via `onSubmit`), so the wizard stays
 * plugin-neutral.
 */
export const EntityWizardBody = ({
  kind,
  plugin,
  entity,
  onClose,
  title,
  typeSelector,
  resourceFilter,
  onSubmit,
  isSubmitting,
  submitError,
}: IEntityWizardBodyProps) => {
  const isCreate = !entity;
  const entityPlugin = plugin?.entities[kind];
  const fields =
    (isCreate
      ? entityPlugin?.form.createFields
      : entityPlugin?.form.editFields) ?? [];

  const steps = groupFields(fields);
  const { stepStates, setStepState, mergedValues, isReady } =
    useEntityWizardState({ steps, entity });

  const submitLabel = isCreate ? "Create" : "Save";

  const stepHasRequired = (step: (typeof steps)[number]) =>
    step.fields.some((field) => field.required);

  return (
    <Wizard
      header={
        <WizardHeader
          title={title}
          onClose={onClose}
          closeButtonAriaLabel="Close"
        />
      }
      onClose={onClose}
      height="min(640px, 70vh)"
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const slice = stepStates[step.group];
        const stepValid = slice?.isValid ?? true;
        // Reachable only once every preceding required-bearing step is valid.
        const blockedByRequired = steps
          .slice(0, index)
          .some(
            (prev) => stepHasRequired(prev) && !stepStates[prev.group]?.isValid,
          );
        // Flag red only after the user has edited the step (not on open).
        const showError = Boolean(slice?.isDirty) && !stepValid;
        return (
          <WizardStep
            key={step.group}
            name={step.group}
            id={`entity-wizard-${slugifyGroup(step.group)}`}
            isDisabled={blockedByRequired}
            status={showError ? "error" : "default"}
            footer={
              isLast
                ? {
                    nextButtonText: submitLabel,
                    onNext: () => void onSubmit(mergedValues),
                    isNextDisabled: isSubmitting || !isReady,
                  }
                : { isNextDisabled: !stepValid }
            }
          >
            <EntityWizardStep
              step={step}
              initialValues={slice?.values ?? {}}
              onStateChanged={(state) =>
                setStepState({ group: step.group, slice: state })
              }
              resourceFilter={resourceFilter}
              typeSelector={index === 0 ? typeSelector : undefined}
              submitError={isLast ? submitError : null}
            />
          </WizardStep>
        );
      })}
    </Wizard>
  );
};
