import type React from "react";
import type { Control, Path } from "react-hook-form";

import { HookFormPFTextInput } from "@app/components/HookFormPFFields";

import type { DomainFormValues } from "../hooks/useDomainForm";
import type { IStorageBackend } from "../storageBackends";

interface IStorageSettingsFieldsProps {
  control: Control<DomainFormValues>;
  backend?: IStorageBackend;
}

/** Renders the selected backend's `storage_settings` inputs (validated by the schema). */
export const StorageSettingsFields: React.FC<IStorageSettingsFieldsProps> = ({
  control,
  backend,
}) => (
  <>
    {backend?.settingsFields.map((field) => (
      <HookFormPFTextInput
        key={field.key}
        control={control}
        name={`storage_settings.${field.key}` as Path<DomainFormValues>}
        fieldId={`domain-storage_settings-${field.key}`}
        label={field.label}
        type={field.isPassword ? "password" : "text"}
        isRequired={field.required}
        helperText={field.helperText}
      />
    ))}
  </>
);
