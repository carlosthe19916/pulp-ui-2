import { useState } from "react";

import type { IEntityForEdit } from "@app/hooks/pluginForm/useEntityForm";
import { buildDefaultValues, buildFieldSchema } from "@app/utils/formSchema";

import type { IFieldGroup } from "./wizardSteps";

export interface IWizardStepSlice {
  values: Record<string, unknown>;
  isValid: boolean;
  isDirty: boolean;
}

interface IUseEntityWizardStateOptions {
  steps: IFieldGroup[];
  entity?: IEntityForEdit;
}

export interface IUseEntityWizardStateResult {
  stepStates: Record<string, IWizardStepSlice>;
  setStepState: (args: { group: string; slice: IWizardStepSlice }) => void;
  mergedValues: Record<string, unknown>;
  isReady: boolean;
}

/**
 * One state slice per field group, seeded synchronously so `isReady` is right before any
 * step mounts; holding values here survives PatternFly unmounting inactive steps.
 */
export const useEntityWizardState = ({
  steps,
  entity,
}: IUseEntityWizardStateOptions): IUseEntityWizardStateResult => {
  const [stepStates, setStepStates] = useState<
    Record<string, IWizardStepSlice>
  >(() => {
    const initial: Record<string, IWizardStepSlice> = {};
    for (const step of steps) {
      const values = buildDefaultValues({
        fields: step.fields,
        source: entity,
      });
      initial[step.group] = {
        values,
        isValid: buildFieldSchema(step.fields).isValidSync(values),
        isDirty: false,
      };
    }
    return initial;
  });

  const setStepState = ({
    group,
    slice,
  }: {
    group: string;
    slice: IWizardStepSlice;
  }) => {
    setStepStates((prev) => {
      const current = prev[group];
      if (
        current &&
        current.isValid === slice.isValid &&
        current.isDirty === slice.isDirty &&
        current.values === slice.values
      ) {
        return prev;
      }
      return { ...prev, [group]: slice };
    });
  };

  const mergedValues: Record<string, unknown> = Object.fromEntries(
    Object.values(stepStates).flatMap((slice) => Object.entries(slice.values)),
  );

  const isReady = Object.values(stepStates).every((slice) => slice.isValid);

  return { stepStates, setStepState, mergedValues, isReady };
};
