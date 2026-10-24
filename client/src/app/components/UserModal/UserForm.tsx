import type React from "react";
import type { UseFormReturn } from "react-hook-form";

import { Checkbox, Form } from "@patternfly/react-core";

import { FormSubmitError } from "@app/components/FormSubmitError";
import { HookFormPFGroupController } from "@app/components/HookFormPFGroupController";
import { HookFormPFTextInput } from "@app/components/HookFormPFTextInput";
import type { IMutationErrorMessage } from "@app/utils/utils";

import type { IUserFormValues } from "./useUserForm";

interface IUserFormProps {
  form: UseFormReturn<IUserFormValues>;
  isCreate: boolean;
  onSubmit: () => void;
  formId: string;
  submitError: IMutationErrorMessage | null;
}

export const UserForm: React.FC<IUserFormProps> = ({
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
      {isCreate && (
        <>
          <HookFormPFTextInput
            control={control}
            name="username"
            fieldId="user-username"
            label="Username"
            isRequired
          />
          <HookFormPFTextInput
            control={control}
            name="password"
            fieldId="user-password"
            label="Password"
            type="password"
            isRequired
          />
        </>
      )}

      <HookFormPFTextInput
        control={control}
        name="email"
        fieldId="user-email"
        label="Email"
        type="email"
      />
      <HookFormPFTextInput
        control={control}
        name="first_name"
        fieldId="user-first_name"
        label="First name"
      />
      <HookFormPFTextInput
        control={control}
        name="last_name"
        fieldId="user-last_name"
        label="Last name"
      />

      <HookFormPFGroupController
        control={control}
        name="is_active"
        fieldId="user-is_active"
        renderInput={({ field: { value, onChange } }) => (
          <Checkbox
            id="user-is_active"
            label="Active"
            isChecked={value}
            onChange={(_e, checked) => onChange(checked)}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="is_staff"
        fieldId="user-is_staff"
        renderInput={({ field: { value, onChange } }) => (
          <Checkbox
            id="user-is_staff"
            label="Staff status"
            isChecked={value}
            onChange={(_e, checked) => onChange(checked)}
          />
        )}
      />
    </Form>
  );
};
