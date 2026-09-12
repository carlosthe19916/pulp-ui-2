import type React from "react";
import type { UseFormReturn } from "react-hook-form";

import { Checkbox, Form } from "@patternfly/react-core";

import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";

import type { UserFormValues } from "../hooks/useUserForm";

interface IUserFormProps {
  form: UseFormReturn<UserFormValues>;
  isCreate: boolean;
  onSubmit: () => void;
}

export const UserForm: React.FC<IUserFormProps> = ({
  form,
  isCreate,
  onSubmit,
}) => {
  const { control } = form;

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {isCreate && (
        <>
          <HookFormPFTextInput
            control={control}
            name="username"
            fieldId="username"
            label="Username"
            isRequired
          />
          <HookFormPFTextInput
            control={control}
            name="password"
            fieldId="password"
            label="Password"
            type="password"
            isRequired
          />
        </>
      )}

      <HookFormPFTextInput
        control={control}
        name="email"
        fieldId="email"
        label="Email"
        type="email"
      />
      <HookFormPFTextInput
        control={control}
        name="first_name"
        fieldId="first_name"
        label="First name"
      />
      <HookFormPFTextInput
        control={control}
        name="last_name"
        fieldId="last_name"
        label="Last name"
      />

      <HookFormPFGroupController
        control={control}
        name="is_active"
        fieldId="is_active"
        renderInput={({ field: { value, onChange } }) => (
          <Checkbox
            id="is_active"
            label="Active"
            isChecked={value}
            onChange={(_e, checked) => onChange(checked)}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="is_staff"
        fieldId="is_staff"
        renderInput={({ field: { value, onChange } }) => (
          <Checkbox
            id="is_staff"
            label="Staff status"
            isChecked={value}
            onChange={(_e, checked) => onChange(checked)}
          />
        )}
      />
    </Form>
  );
};
