import { type ReactNode } from "react";

import { Wizard, WizardHeader, WizardStep } from "@patternfly/react-core";

import type { EntityType, IPlugin } from "@catalog";
import { EntityWizardStep } from "@app/components/Entity/EntityWizardStep";
import { useEntityWizardState } from "@app/components/Entity/useEntityWizardState";
import { groupFields, slugifyGroup } from "@app/components/Entity/wizardSteps";
import type { ITypeaheadOption } from "@app/components/TypeaheadSelect";
import type { IContentFamilyConfig } from "@app/queries/utils/families";
import { useEntitySubmit } from "@app/hooks/useEntitySubmit";
import type { IEntityForEdit } from "@app/hooks/useEntityForm";

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
 * (remotes). Steps come from the fields' `group`; each is an independent form whose
 * validity gates Next. The last step submits merged values once every step is valid.
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
  const isCreate = !entity;
  const entityPlugin = plugin?.entities[config.kind];
  const fields =
    (isCreate
      ? entityPlugin?.form.createFields
      : entityPlugin?.form.editFields) ?? [];

  const steps = groupFields(fields);
  const { stepStates, setStepState, mergedValues, isReady } =
    useEntityWizardState({ steps, entity });
  const { submit, isSubmitting } = useEntitySubmit({
    config,
    plugin,
    entity,
    onClose,
  });

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
                    onNext: () => submit(mergedValues),
                    isNextDisabled: isSubmitting || !isReady,
                  }
                : { isNextDisabled: !stepValid }
            }
          >
            <EntityWizardStep
              step={step}
              initialValues={slice?.values ?? {}}
              onStateChanged={(state) => setStepState(step.group, state)}
              resourceOptions={resourceOptions}
              typeSelector={index === 0 ? typeSelector : undefined}
            />
          </WizardStep>
        );
      })}
    </Wizard>
  );
};
