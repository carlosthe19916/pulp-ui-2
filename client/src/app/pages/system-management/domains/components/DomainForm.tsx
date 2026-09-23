import type React from "react";
import { type UseFormReturn } from "react-hook-form";

import {
  Checkbox,
  Form,
  FormSelect,
  FormSelectOption,
} from "@patternfly/react-core";

import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";

import type { DomainFormValues } from "../hooks/useDomainForm";
import { STORAGE_BACKEND_BY_CLASS, STORAGE_BACKENDS } from "../storageBackends";
import { StorageSettingsFields } from "./StorageSettingsFields";

interface IDomainFormProps {
  form: UseFormReturn<DomainFormValues>;
  onSubmit: () => void;
  formId: string;
}

export const DomainForm: React.FC<IDomainFormProps> = ({
  form,
  onSubmit,
  formId,
}) => {
  const { control, watch, resetField } = form;
  const storageClass = watch("storage_class");
  const backend = STORAGE_BACKEND_BY_CLASS[storageClass];

  return (
    <Form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <HookFormPFTextInput
        control={control}
        name="name"
        fieldId="domain-name"
        label="Name"
        isRequired
        helperText="Letters, numbers, hyphens and underscores; up to 50 characters."
      />
      <HookFormPFTextInput
        control={control}
        name="description"
        fieldId="domain-description"
        label="Description"
      />

      <HookFormPFGroupController
        control={control}
        name="storage_class"
        fieldId="domain-storage_class"
        label="Storage backend"
        isRequired
        renderInput={({ field: { value, onChange } }) => (
          <FormSelect
            id="domain-storage_class"
            value={value}
            onChange={(_e, newValue) => {
              onChange(newValue);
              // Drop values typed for the previous backend.
              resetField("storage_settings", { defaultValue: {} });
            }}
          >
            {STORAGE_BACKENDS.map((option) => (
              <FormSelectOption
                key={option.value}
                value={option.value}
                label={
                  option.deprecated
                    ? `${option.label} (deprecated)`
                    : option.label
                }
              />
            ))}
          </FormSelect>
        )}
      />

      <StorageSettingsFields control={control} backend={backend} />

      <HookFormPFGroupController
        control={control}
        name="redirect_to_object_storage"
        fieldId="domain-redirect_to_object_storage"
        renderInput={({ field: { value, onChange } }) => (
          <Checkbox
            id="domain-redirect_to_object_storage"
            label="Redirect to object storage"
            description="Have the content app redirect to object storage."
            isChecked={value}
            onChange={(_e, checked) => onChange(checked)}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="hide_guarded_distributions"
        fieldId="domain-hide_guarded_distributions"
        renderInput={({ field: { value, onChange } }) => (
          <Checkbox
            id="domain-hide_guarded_distributions"
            label="Hide guarded distributions"
            description="Hide distributions with a content guard in the content app."
            isChecked={value}
            onChange={(_e, checked) => onChange(checked)}
          />
        )}
      />
    </Form>
  );
};
