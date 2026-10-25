import type React from "react";
import { Controller, type UseFormReturn } from "react-hook-form";

import { Form, FormGroup } from "@patternfly/react-core";

import { FormSubmitError } from "@app/components/FormSubmitError";
import { HookFormPFTextInput } from "@app/components/HookFormPFTextInput";
import type { IMutationErrorMessage } from "@app/utils/utils";

import { PermissionInput } from "./PermissionInput";
import type { IRoleFormValues } from "./useRoleForm";

interface IRoleFormProps {
  form: UseFormReturn<IRoleFormValues>;
  isCreate: boolean;
  onSubmit: () => void;
  formId: string;
  submitError: IMutationErrorMessage | null;
}

export const RoleForm: React.FC<IRoleFormProps> = ({
  form,
  isCreate,
  onSubmit,
  formId,
  submitError,
}) => {
  const { control } = form;

  return (
    <Form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <FormSubmitError error={submitError} />
      <HookFormPFTextInput
        control={control}
        name="name"
        fieldId="role-name"
        label="Name"
        isRequired={isCreate}
        isDisabled={!isCreate}
      />
      <HookFormPFTextInput
        control={control}
        name="description"
        fieldId="role-description"
        label="Description"
      />
      <FormGroup label="Permissions" fieldId="role-permissions">
        <Controller
          name="permissions"
          control={control}
          render={({ field }) => (
            <PermissionInput
              id="role-permissions"
              value={field.value ?? []}
              onChange={field.onChange}
            />
          )}
        />
      </FormGroup>
    </Form>
  );
};
