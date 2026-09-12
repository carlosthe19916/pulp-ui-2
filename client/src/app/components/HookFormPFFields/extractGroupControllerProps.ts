import type { FieldValues, Path } from "react-hook-form";

import type { IBaseHookFormPFGroupControllerProps } from "./HookFormPFGroupController";

// Pulls props needed by the group controller and passes the rest to a rendered input.
export const extractGroupControllerProps = <
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
  TProps extends IBaseHookFormPFGroupControllerProps<TFieldValues, TName>,
>(
  props: TProps,
): {
  extractedProps: IBaseHookFormPFGroupControllerProps<TFieldValues, TName>;
  remainingProps: Omit<
    TProps,
    keyof IBaseHookFormPFGroupControllerProps<TFieldValues, TName>
  >;
} => {
  const {
    control,
    label,
    labelIcon,
    name,
    fieldId,
    isRequired,
    errorsSuppressed,
    helperText,
    className,
    formGroupProps,
    helperTextTestId,
    ...remainingProps
  } = props;
  return {
    extractedProps: {
      control,
      labelIcon,
      label,
      name,
      fieldId,
      isRequired,
      errorsSuppressed,
      helperText,
      className,
      formGroupProps,
      helperTextTestId,
    },
    remainingProps,
  };
};
