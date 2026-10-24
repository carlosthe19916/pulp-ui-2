import type React from "react";
import type { Control, Path } from "react-hook-form";

import { HookFormPFTextInput } from "@app/components/HookFormPFTextInput";

import type { IStorageBackend } from "../../utils/storageBackends";
import type { IDomainFormValues } from "./useDomainForm";

interface IStorageSettingsFieldsProps {
  control: Control<IDomainFormValues>;
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
        name={`storage_settings.${field.key}` as Path<IDomainFormValues>}
        fieldId={`domain-storage_settings-${field.key}`}
        label={field.label}
        type={field.isPassword ? "password" : "text"}
        isRequired={field.required}
        helperText={field.helperText}
      />
    ))}
  </>
);
