import type React from "react";
import { Controller, useFormContext } from "react-hook-form";

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  FileUpload,
  FormGroup,
  FormGroupLabelHelp,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  Gallery,
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
import type { ResourceFilterMap } from "@app/utils/resourceFilter";

import type { IKeyValueRow, ISecretValue } from "../derive/codecs";
import { isRequired } from "../derive/schema";
import { isReadOnly } from "../derive/visibility";
import type { FormValues, IFieldDef, IFormContext } from "../types";
import { CodeEditorField } from "./CodeEditorField";
import { KeyValueField } from "./KeyValueField";
import { SecretField } from "./SecretField";
import { StringListField } from "./StringListField";

interface IFieldRendererProps {
  field: IFieldDef;
  ctx: IFormContext;
  idPrefix: string;
  /** Compatible pulp_types per resource kind, for pickers that don't set their own. */
  resourceFilter: ResourceFilterMap;
}

const isFile = (value: unknown): value is File =>
  typeof File !== "undefined" && value instanceof File;

/** One field bound to the surrounding react-hook-form: label, help, input, errors, warnings. */
export const FieldRenderer: React.FC<IFieldRendererProps> = ({
  field,
  ctx,
  idPrefix,
  resourceFilter,
}) => {
  const { control } = useFormContext<FormValues>();
  const fieldId = `${idPrefix}-${field.key}`;
  const isDisabled = isReadOnly({ field, ctx });
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
                  isDisabled={isDisabled}
                  onChange={(_event, checked) => onChange(checked)}
                />
              );
            case "textarea":
              return (
                <TextArea
                  id={fieldId}
                  value={(value as string) ?? ""}
                  placeholder={field.placeholder}
                  isDisabled={isDisabled}
                  validated={validated}
                  resizeOrientation="vertical"
                  onChange={(_event, next) => onChange(next)}
                  onBlur={onBlur}
                />
              );
            case "select":
              return (
                <FormSelect
                  id={fieldId}
                  value={(value as string) ?? ""}
                  isDisabled={isDisabled}
                  validated={validated}
                  onChange={(_event, next) => onChange(next)}
                  onBlur={onBlur}
                >
                  {!required && <FormSelectOption value="" label="Default" />}
                  {field.options.map((option) => (
                    <FormSelectOption
                      key={String(option.value)}
                      value={String(option.value)}
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
                  isDisabled={isDisabled}
                  onChange={() => onChange(option.value)}
                />
              ));
            case "tiles":
              return (
                <Gallery hasGutter minWidths={{ default: "14rem" }}>
                  {field.options.map((option) => {
                    const optionId = `${fieldId}-${String(option.value)}`;
                    return (
                      <Card
                        key={optionId}
                        id={`${optionId}-card`}
                        isSelectable
                        isSelected={value === option.value}
                        isDisabled={isDisabled}
                      >
                        <CardHeader
                          selectableActions={{
                            selectableActionId: optionId,
                            selectableActionAriaLabelledby: `${optionId}-title`,
                            name: fieldId,
                            variant: "single",
                            onChange: () => onChange(option.value),
                          }}
                        >
                          <CardTitle id={`${optionId}-title`}>
                            {option.label}
                          </CardTitle>
                        </CardHeader>
                        {option.description && (
                          <CardBody>{option.description}</CardBody>
                        )}
                      </Card>
                    );
                  })}
                </Gallery>
              );
            case "stringList":
              return (
                <StringListField
                  id={fieldId}
                  label={field.label}
                  value={(value as string[]) ?? []}
                  isDisabled={isDisabled}
                  onChange={onChange}
                />
              );
            case "keyValue":
              return (
                <KeyValueField
                  id={fieldId}
                  label={field.label}
                  value={(value as IKeyValueRow[]) ?? []}
                  isDisabled={isDisabled}
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
                  isDisabled={isDisabled}
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
                  isDisabled={isDisabled}
                  onChange={onChange}
                />
              );
            case "file":
              return (
                <FileUpload
                  id={fieldId}
                  filename={isFile(value) ? value.name : ""}
                  isDisabled={isDisabled}
                  validated={validated}
                  browseButtonText="Upload"
                  hideDefaultPreview
                  onFileInputChange={(_event, file) => onChange(file)}
                  onClearClick={() => onChange(null)}
                />
              );
            case "resource": {
              const pulpTypes =
                field.pulpTypes ?? resourceFilter[field.resourceKind];
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
                  isDisabled={isDisabled}
                  ctx={ctx}
                  onChange={onChange}
                />
              );
            }
            default:
              return (
                <TextInput
                  id={fieldId}
                  type={
                    field.kind === "number"
                      ? "number"
                      : field.kind === "url"
                        ? "url"
                        : "text"
                  }
                  value={(value as string) ?? ""}
                  placeholder={field.placeholder}
                  isDisabled={isDisabled}
                  validated={validated}
                  onChange={(_event, next) => onChange(next)}
                  onBlur={onBlur}
                />
              );
          }
        })();

        const isGroupLabelled = field.kind !== "switch";
        return (
          <FormGroup
            fieldId={fieldId}
            label={isGroupLabelled ? field.label : undefined}
            isRequired={isGroupLabelled && required}
            labelHelp={isGroupLabelled ? labelHelp : undefined}
            role={field.kind === "radio" ? "radiogroup" : undefined}
            isStack={field.kind === "radio"}
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
