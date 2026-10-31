import type React from "react";
import { Controller, useFormContext } from "react-hook-form";

import {
  Checkbox,
  FormGroup,
  FormGroupLabelHelp,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  Popover,
  Radio,
  Switch,
  TextArea,
  TextInput,
} from "@patternfly/react-core";

import {
  AsyncResourceMultiSelect,
  AsyncResourceSelect,
} from "@app/components/AsyncResourceSelect";

import type { IKeyValueRow, ISecretValue } from "../derive/codecs";
import { isRequired } from "../derive/schema";
import type { FormValues, IFieldDef, IFormContext } from "../types";
import { CodeEditorField } from "./CodeEditorField";
import { KeyValueField } from "./KeyValueField";
import { SecretField } from "./SecretField";
import { StringListField } from "./StringListField";

interface IFieldRendererProps {
  field: IFieldDef;
  ctx: IFormContext;
  idPrefix: string;
}

/** One field bound to the surrounding react-hook-form: label, help, input, errors, warnings. */
export const FieldRenderer: React.FC<IFieldRendererProps> = ({
  field,
  ctx,
  idPrefix,
}) => {
  const { control } = useFormContext<FormValues>();
  const fieldId = `${idPrefix}-${field.key}`;
  const required = isRequired({ field, ctx });
  const warnings = (field.warnings ?? []).filter((warning) =>
    warning.when(ctx),
  );

  const labelHelp = field.help ? (
    <Popover headerContent={field.label} bodyContent={field.help}>
      <FormGroupLabelHelp aria-label={`More info for ${field.label}`} />
    </Popover>
  ) : undefined;

  return (
    <Controller
      name={field.key}
      control={control}
      render={({
        field: { value, onChange, onBlur },
        fieldState: { error, isDirty, isTouched },
        formState: { isSubmitted },
      }) => {
        // Errors show once the field is engaged or a submit was attempted.
        const showError =
          Boolean(error?.message) && (isDirty || isTouched || isSubmitted);
        const validated = showError ? "error" : "default";

        const input = (() => {
          switch (field.kind) {
            case "switch":
              return (
                <Switch
                  id={fieldId}
                  label={field.label}
                  isChecked={value === true}
                  onChange={(_event, checked) => onChange(checked)}
                />
              );
            case "textarea":
              return (
                <TextArea
                  id={fieldId}
                  value={(value as string) ?? ""}
                  placeholder={field.placeholder}
                  validated={validated}
                  resizeOrientation="vertical"
                  onChange={(_event, next) => onChange(next)}
                  onBlur={onBlur}
                />
              );
            case "select":
              // A native select only holds strings: its value is the option's
              // index, so a boolean or number option keeps its type.
              return (
                <FormSelect
                  id={fieldId}
                  value={String(
                    field.options.findIndex((option) => option.value === value),
                  )}
                  validated={validated}
                  onChange={(_event, index) =>
                    onChange(field.options[Number(index)]?.value ?? "")
                  }
                  onBlur={onBlur}
                >
                  <FormSelectOption
                    value="-1"
                    label={required ? "Select an option" : "Default"}
                    isPlaceholder={required}
                    isDisabled={required}
                  />
                  {field.options.map((option, index) => (
                    <FormSelectOption
                      key={String(option.value)}
                      value={String(index)}
                      label={option.label}
                    />
                  ))}
                </FormSelect>
              );
            case "radio":
              return field.options.map((option) => (
                <Radio
                  key={String(option.value)}
                  id={`${fieldId}-${String(option.value)}`}
                  name={fieldId}
                  label={option.label}
                  description={option.description}
                  isChecked={value === option.value}
                  onChange={() => onChange(option.value)}
                />
              ));
            case "stringList":
              return (
                <StringListField
                  id={fieldId}
                  label={field.label}
                  value={(value as string[]) ?? []}
                  onChange={onChange}
                />
              );
            case "checkboxes": {
              const checked = (value as unknown[] | undefined) ?? [];
              return field.options.map((option) => (
                <Checkbox
                  key={String(option.value)}
                  id={`${fieldId}-${String(option.value)}`}
                  label={option.label}
                  description={option.description}
                  isChecked={checked.includes(option.value)}
                  onChange={(_event, isChecked) =>
                    onChange(
                      isChecked
                        ? [...checked, option.value]
                        : checked.filter((item) => item !== option.value),
                    )
                  }
                />
              ));
            }
            case "keyValue":
              return (
                <KeyValueField
                  id={fieldId}
                  label={field.label}
                  value={(value as IKeyValueRow[]) ?? []}
                  onChange={onChange}
                />
              );
            case "secret":
              return (
                <SecretField
                  id={fieldId}
                  label={field.label}
                  mode={ctx.mode}
                  editor={field.editor}
                  value={value as ISecretValue}
                  onChange={onChange}
                />
              );
            case "code":
              return (
                <CodeEditorField
                  id={fieldId}
                  label={field.label}
                  language={field.language}
                  value={(value as string) ?? ""}
                  template={field.template}
                  downloadName={field.downloadName}
                  onChange={onChange}
                />
              );
            case "resource": {
              const { pulpTypes } = field;
              return field.multiple ? (
                <AsyncResourceMultiSelect
                  id={fieldId}
                  label={field.label}
                  resourceKind={field.resourceKind}
                  value={(value as string[]) ?? []}
                  pulpTypes={pulpTypes}
                  onChange={onChange}
                />
              ) : (
                <AsyncResourceSelect
                  id={fieldId}
                  label={field.label}
                  resourceKind={field.resourceKind}
                  value={(value as string) ?? ""}
                  pulpTypes={pulpTypes}
                  isClearable={!required}
                  onChange={onChange}
                />
              );
            }
            case "custom": {
              const Custom = field.component;
              return (
                <Custom
                  id={fieldId}
                  field={field}
                  value={value}
                  ctx={ctx}
                  onChange={onChange}
                />
              );
            }
            case "text":
            case "url":
            case "number":
              return (
                <TextInput
                  id={fieldId}
                  type={field.kind}
                  value={(value as string) ?? ""}
                  placeholder={field.placeholder}
                  validated={validated}
                  onChange={(_event, next) => onChange(next)}
                  onBlur={onBlur}
                />
              );
            default: {
              // A new field kind fails to compile here until it has an input.
              const unhandled: never = field;
              return unhandled;
            }
          }
        })();

        const isGroupLabelled = field.kind !== "switch";
        return (
          <FormGroup
            fieldId={fieldId}
            label={isGroupLabelled ? field.label : undefined}
            isRequired={isGroupLabelled && required}
            labelHelp={isGroupLabelled ? labelHelp : undefined}
            role={
              field.kind === "radio"
                ? "radiogroup"
                : field.kind === "checkboxes"
                  ? "group"
                  : undefined
            }
            isStack={field.kind === "radio" || field.kind === "checkboxes"}
          >
            {input}
            {(showError ||
              warnings.length > 0 ||
              (!isGroupLabelled && field.help)) && (
              <FormHelperText>
                <HelperText>
                  {showError && (
                    <HelperTextItem variant="error">
                      {error?.message}
                    </HelperTextItem>
                  )}
                  {warnings.map((warning) => (
                    <HelperTextItem key={warning.message} variant="warning">
                      {warning.message}
                    </HelperTextItem>
                  ))}
                  {!isGroupLabelled && field.help && !showError && (
                    <HelperTextItem>{field.help}</HelperTextItem>
                  )}
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
        );
      }}
    />
  );
};
