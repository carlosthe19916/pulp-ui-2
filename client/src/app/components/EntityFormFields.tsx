import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";

import {
  Checkbox,
  type DropEvent,
  FileUpload,
  FormGroup,
  FormGroupLabelHelp,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  Popover,
  TextArea,
  TextInput,
} from "@patternfly/react-core";

import {
  AsyncResourceMultiSelect,
  AsyncResourceSelect,
} from "@app/components/AsyncResourceSelect";
import type { IEntityField } from "@app/utils/entityField";
import type { ResourceFilterMap } from "@app/utils/resourceFilter";

const isFile = (value: unknown): value is File => {
  return typeof File !== "undefined" && value instanceof File;
};

interface IEntityFormFieldsProps<
  TFieldValues extends FieldValues = Record<string, unknown>,
> {
  fields: IEntityField[];
  control: Control<TFieldValues>;
  idPrefix: string;
  /**
   * Compatible pulp_types for `type: "asyncResource"` fields, keyed by the field's
   * resourceKind; the pickers send them as a server-side type filter.
   */
  resourceFilter?: ResourceFilterMap;
}

/**
 * Renders entity fields bound to a react-hook-form `control`. `content` fields need
 * a repository to pick from, so the caller renders them (see `TaskActionModal`).
 */
export const EntityFormFields = <
  TFieldValues extends FieldValues = Record<string, unknown>,
>({
  fields,
  control,
  idPrefix,
  resourceFilter,
}: IEntityFormFieldsProps<TFieldValues>) => {
  return (
    <>
      {fields.map((field) => {
        if (field.type === "content") {
          return null;
        }
        const fieldId = `${idPrefix}-${field.key}`;
        const name = field.key as Path<TFieldValues>;

        return (
          <Controller
            key={field.key}
            name={name}
            control={control}
            render={({
              field: rhfField,
              fieldState: { error, isDirty, isTouched },
              formState: { isSubmitted },
            }) => {
              // Surface errors only after the field is engaged or a submit is
              // attempted, so a freshly opened form isn't pre-filled with them.
              const showError =
                Boolean(error) && (isDirty || isTouched || isSubmitted);
              const validated = showError ? "error" : "default";
              const helper = showError ? (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant="error">
                      {error?.message}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              ) : null;

              const labelHelp = field.helpText ? (
                <Popover
                  headerContent={field.label}
                  bodyContent={field.helpText}
                >
                  <FormGroupLabelHelp
                    aria-label={`More info for ${field.label}`}
                  />
                </Popover>
              ) : undefined;

              if (field.type === "boolean") {
                return (
                  <FormGroup fieldId={fieldId}>
                    <Checkbox
                      id={fieldId}
                      label={field.label}
                      description={field.helpText}
                      isChecked={Boolean(rhfField.value)}
                      onChange={(_e, checked) => rhfField.onChange(checked)}
                    />
                  </FormGroup>
                );
              }

              if (field.type === "stringList" || field.type === "json") {
                return (
                  <FormGroup
                    label={field.label}
                    fieldId={fieldId}
                    isRequired={field.required}
                    labelHelp={labelHelp}
                  >
                    <TextArea
                      id={fieldId}
                      value={(rhfField.value as string) ?? ""}
                      onChange={(_e, value) => rhfField.onChange(value)}
                      validated={validated}
                      resizeOrientation="vertical"
                      rows={field.type === "json" ? 8 : 3}
                    />
                    {helper ?? (
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem>
                            {field.type === "json"
                              ? "A JSON document."
                              : "One per line."}
                          </HelperTextItem>
                        </HelperText>
                      </FormHelperText>
                    )}
                  </FormGroup>
                );
              }

              if (field.type === "textarea") {
                return (
                  <FormGroup
                    label={field.label}
                    fieldId={fieldId}
                    isRequired={field.required}
                    labelHelp={labelHelp}
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
                    labelHelp={labelHelp}
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
                    labelHelp={labelHelp}
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

              if (field.type === "asyncResource" && field.multiple) {
                return (
                  <FormGroup
                    label={field.label}
                    fieldId={fieldId}
                    isRequired={field.required}
                    labelHelp={labelHelp}
                  >
                    <AsyncResourceMultiSelect
                      id={fieldId}
                      label={field.label}
                      resourceKind={field.resourceKind}
                      value={(rhfField.value as string[]) ?? []}
                      onChange={(value) => rhfField.onChange(value)}
                      pulpTypes={resourceFilter?.[field.resourceKind]}
                    />
                    {helper}
                  </FormGroup>
                );
              }

              if (field.type === "asyncResource") {
                return (
                  <FormGroup
                    label={field.label}
                    fieldId={fieldId}
                    isRequired={field.required}
                    labelHelp={labelHelp}
                  >
                    <AsyncResourceSelect
                      id={fieldId}
                      label={field.label}
                      resourceKind={field.resourceKind}
                      value={(rhfField.value as string) ?? ""}
                      onChange={(value) => rhfField.onChange(value)}
                      pulpTypes={resourceFilter?.[field.resourceKind]}
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
                    labelHelp={labelHelp}
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
                  labelHelp={labelHelp}
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
};
