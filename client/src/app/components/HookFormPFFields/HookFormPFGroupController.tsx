import type React from "react";
import {
  Controller,
  type Control,
  type ControllerProps,
  type FieldValues,
  type Path,
} from "react-hook-form";
import {
  FormGroup,
  type FormGroupProps,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from "@patternfly/react-core";

// Separate interfaces with and without `renderInput` for convenience.
// Generic type params match react-hook-form's <Controller>.
export interface IBaseHookFormPFGroupControllerProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
> {
  control: Control<TFieldValues>;
  label?: React.ReactNode;
  labelIcon?: React.ReactElement;
  name: TName;
  fieldId: string;
  isRequired?: boolean;
  errorsSuppressed?: boolean;
  helperText?: React.ReactNode;
  className?: string;
  formGroupProps?: FormGroupProps;
  helperTextTestId?: string;
}

export interface IHookFormPFGroupControllerProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
> extends IBaseHookFormPFGroupControllerProps<TFieldValues, TName> {
  renderInput: ControllerProps<TFieldValues, TName>["render"];
}

export const HookFormPFGroupController = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
>({
  control,
  label,
  labelIcon,
  name,
  fieldId,
  isRequired = false,
  errorsSuppressed = false,
  helperText,
  className,
  formGroupProps = {},
  helperTextTestId,
  renderInput,
}: IHookFormPFGroupControllerProps<TFieldValues, TName>) => (
  <Controller<TFieldValues, TName>
    control={control}
    name={name}
    render={({ field, fieldState, formState }) => {
      const { isDirty, isTouched, error } = fieldState;
      const shouldDisplayError =
        error?.message && (isDirty || isTouched) && !errorsSuppressed;
      return (
        <FormGroup
          labelHelp={labelIcon}
          label={label}
          fieldId={fieldId}
          className={className}
          isRequired={isRequired}
          onBlur={field.onBlur}
          {...formGroupProps}
        >
          {renderInput({ field, fieldState, formState })}
          {helperText || shouldDisplayError ? (
            <FormHelperText id={`${fieldId}-helper`}>
              <HelperText>
                <HelperTextItem
                  data-ouia-component-id={helperTextTestId}
                  variant={shouldDisplayError ? "error" : "default"}
                >
                  {shouldDisplayError ? error.message : helperText}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          ) : null}
        </FormGroup>
      );
    }}
  />
);
