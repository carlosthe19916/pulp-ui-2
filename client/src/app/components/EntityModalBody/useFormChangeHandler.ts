import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  type FieldValues,
  type UseFormReturn,
  useWatch,
} from "react-hook-form";

export interface IFormStepState<TValues extends FieldValues = FieldValues> {
  values: TValues;
  isValid: boolean;
  isDirty: boolean;
}

interface IUseFormChangeHandlerOptions<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  onStateChanged: (state: IFormStepState<TValues>) => void;
}

/**
 * Lifts a form's live `{ values, isValid, isDirty }` to a parent; fires only when that
 * state changes, so a parent `setState` won't loop.
 */
export const useFormChangeHandler = <TValues extends FieldValues>({
  form,
  onStateChanged,
}: IUseFormChangeHandlerOptions<TValues>) => {
  const {
    control,
    formState: { isValid, isDirty },
  } = form;
  const values = useWatch({ control });
  const state = useMemo<IFormStepState<TValues>>(
    () => ({ values: values as TValues, isValid, isDirty }),
    [values, isValid, isDirty],
  );

  const onStateChangedRef = useRef(onStateChanged);
  useLayoutEffect(() => {
    onStateChangedRef.current = onStateChanged;
  });

  useEffect(() => {
    onStateChangedRef.current(state);
  }, [state]);
};
