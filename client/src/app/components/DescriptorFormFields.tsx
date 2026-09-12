import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";

import {
  Checkbox,
  type DropEvent,
  FileUpload,
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  TextArea,
  TextInput,
} from "@patternfly/react-core";

import type { IFieldDescriptor, ResourceKind } from "@app/descriptors/types";

import { TypeaheadSelect, type ITypeaheadOption } from "./TypeaheadSelect";

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

interface IDescriptorFormFieldsProps<
  TFieldValues extends FieldValues = Record<string, unknown>,
> {
  fields: IFieldDescriptor[];
  control: Control<TFieldValues>;
  idPrefix: string;
  /** Options for `type: "resource"` fields, keyed by the field's resourceKind. */
  resourceOptions?: Partial<Record<ResourceKind, ITypeaheadOption[]>>;
}

/**
 * Renders a list of FieldDescriptors bound to a react-hook-form `control`,
 * following the same PatternFly Form/FormGroup structure used by the admin
 * user modals (CreateUserModal / EditUserModal).
 */
export function DescriptorFormFields<
  TFieldValues extends FieldValues = Record<string, unknown>,
>({
  fields,
  control,
  idPrefix,
  resourceOptions,
}: IDescriptorFormFieldsProps<TFieldValues>) {
  return (
    <>
      {fields.map((field) => {
        const fieldId = `${idPrefix}-${field.key}`;
        const name = field.key as Path<TFieldValues>;

        return (
          <Controller
            key={field.key}
            name={name}
            control={control}
            render={({ field: rhfField, fieldState: { error } }) => {
              const validated = error ? "error" : "default";
              const helper = error ? (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant="error">
                      {error.message}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              ) : null;

              if (field.type === "boolean") {
                return (
                  <FormGroup fieldId={fieldId}>
                    <Checkbox
                      id={fieldId}
                      label={field.label}
                      isChecked={Boolean(rhfField.value)}
                      onChange={(_e, checked) => rhfField.onChange(checked)}
                    />
                  </FormGroup>
                );
              }

              if (field.type === "textarea") {
                return (
                  <FormGroup
                    label={field.label}
                    fieldId={fieldId}
                    isRequired={field.required}
                  >
                    <TextArea
                      id={fieldId}
                      value={(rhfField.value as string) ?? ""}
                      onChange={(_e, value) => rhfField.onChange(value)}
                      validated={validated}
                    />
                    {helper}
                  </FormGroup>
                );
              }

              if (field.type === "number") {
                const numberValue = rhfField.value;
                return (
                  <FormGroup
                    label={field.label}
                    fieldId={fieldId}
                    isRequired={field.required}
                  >
                    <TextInput
                      id={fieldId}
                      type="number"
                      value={
                        numberValue === undefined ||
                        numberValue === null ||
                        Number.isNaN(numberValue as number)
                          ? ""
                          : String(numberValue)
                      }
                      onChange={(_e, value) =>
                        rhfField.onChange(
                          value === "" ? undefined : Number(value),
                        )
                      }
                      validated={validated}
                    />
                    {helper}
                  </FormGroup>
                );
              }

              if (field.type === "select") {
                return (
                  <FormGroup
                    label={field.label}
                    fieldId={fieldId}
                    isRequired={field.required}
                  >
                    <FormSelect
                      id={fieldId}
                      value={(rhfField.value as string) ?? ""}
                      onChange={(_e, value) => rhfField.onChange(value)}
                    >
                      {(field.options ?? []).map((option) => (
                        <FormSelectOption
                          key={option.value}
                          value={option.value}
                          label={option.label}
                        />
                      ))}
                    </FormSelect>
                    {helper}
                  </FormGroup>
                );
              }

              if (field.type === "resource") {
                const options =
                  (field.resourceKind &&
                    resourceOptions?.[field.resourceKind]) ??
                  [];
                return (
                  <FormGroup
                    label={field.label}
                    fieldId={fieldId}
                    isRequired={field.required}
                  >
                    <TypeaheadSelect
                      id={fieldId}
                      ariaLabel={field.label}
                      placeholder={`Select ${field.label.toLowerCase()}…`}
                      options={options}
                      value={(rhfField.value as string) ?? ""}
                      onChange={(value) => rhfField.onChange(value)}
                    />
                    {helper}
                  </FormGroup>
                );
              }

              if (field.type === "file") {
                return (
                  <FormGroup
                    label={field.label}
                    fieldId={fieldId}
                    isRequired={field.required}
                  >
                    <FileUpload
                      id={fieldId}
                      filename={
                        isFile(rhfField.value) ? rhfField.value.name : ""
                      }
                      onFileInputChange={(_event: DropEvent, file: File) =>
                        rhfField.onChange(file)
                      }
                      onClearClick={() => rhfField.onChange(null)}
                    />
                    {helper}
                  </FormGroup>
                );
              }

              return (
                <FormGroup
                  label={field.label}
                  fieldId={fieldId}
                  isRequired={field.required}
                >
                  <TextInput
                    id={fieldId}
                    value={(rhfField.value as string) ?? ""}
                    onChange={(_e, value) => rhfField.onChange(value)}
                    validated={validated}
                  />
                  {helper}
                </FormGroup>
              );
            }}
          />
        );
      })}
    </>
  );
}
