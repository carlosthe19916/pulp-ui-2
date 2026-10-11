import { useCallback, useMemo, useState } from "react";

import {
  buildDefaultValues,
  buildFieldSchema,
} from "@app/components/Entity/formSchema";
import type { IFieldGroup } from "@app/components/Entity/wizardSteps";
import type { IEntityForEdit } from "@app/hooks/useEntityForm";

export interface IWizardStepSlice {
  values: Record<string, unknown>;
  isValid: boolean;
  isDirty: boolean;
}

interface IUseEntityWizardStateArgs {
  steps: IFieldGroup[];
  entity?: IEntityForEdit;
}

export interface IUseEntityWizardStateResult {
  stepStates: Record<string, IWizardStepSlice>;
  setStepState: (group: string, slice: IWizardStepSlice) => void;
  mergedValues: Record<string, unknown>;
  isReady: boolean;
}

/**
 * One state slice per field group. Slices are seeded synchronously (defaults + a
 * sync yup check) so `isReady` is correct before any step mounts, and holding the
 * values here lets a step restore its inputs — PatternFly mounts only the active
 * step, discarding the others' form state on navigation.
 */
export const useEntityWizardState = ({
  steps,
  entity,
}: IUseEntityWizardStateArgs): IUseEntityWizardStateResult => {
  const [stepStates, setStepStates] = useState<
    Record<string, IWizardStepSlice>
  >(() => {
    const initial: Record<string, IWizardStepSlice> = {};
    for (const step of steps) {
      const values = buildDefaultValues(step.fields, entity);
      initial[step.group] = {
        values,
        isValid: buildFieldSchema(step.fields).isValidSync(values),
        isDirty: false,
      };
    }
    return initial;
  });

  const setStepState = useCallback((group: string, slice: IWizardStepSlice) => {
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
  }, []);

  const mergedValues = useMemo(
    () =>
      Object.assign(
        {},
        ...Object.values(stepStates).map((slice) => slice.values),
      ) as Record<string, unknown>,
    [stepStates],
  );

  const isReady = useMemo(
    () => Object.values(stepStates).every((slice) => slice.isValid),
    [stepStates],
  );

  return { stepStates, setStepState, mergedValues, isReady };
};
