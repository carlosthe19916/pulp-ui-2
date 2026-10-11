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

interface IUseFormChangeHandlerArgs<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  onStateChanged: (state: IFormStepState<TValues>) => void;
}

/**
 * Lifts a form's live `{ values, isValid, isDirty }` to a parent. `onStateChanged`
 * is held in a ref so callers needn't memoize it, and the effect fires only when
 * the derived state changes, so wiring it into a parent `setState` won't loop.
 */
export const useFormChangeHandler = <TValues extends FieldValues>({
  form,
  onStateChanged,
}: IUseFormChangeHandlerArgs<TValues>) => {
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
