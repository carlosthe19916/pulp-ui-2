import type React from "react";
import { useMemo } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";

import { Form, FormGroup } from "@patternfly/react-core";

import { FormSubmitError } from "@app/components/FormSubmitError";
import { HookFormPFTextInput } from "@app/components/HookFormPFTextInput";
import { useAllRolesListQuery } from "@app/queries/roles";
import type { IMutationErrorMessage } from "@app/utils/utils";

import { PermissionMultiSelect } from "./PermissionMultiSelect";
import { collectPermissionOptions } from "./permissionOptions";
import type { RoleFormValues } from "./useRoleForm";

interface IRoleFormProps {
  form: UseFormReturn<RoleFormValues>;
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
  const { control, watch } = form;
  const { data: rolesData } = useAllRolesListQuery();

  const permissions = watch("permissions");
  const permissionOptions = useMemo(
    () =>
      collectPermissionOptions({
        rolePermissionLists: (rolesData?.results ?? []).map(
          (role) => role.permissions,
        ),
        selected: permissions ?? [],
      }),
    [permissions, rolesData?.results],
  );

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
            <PermissionMultiSelect
              id="role-permissions"
              options={permissionOptions}
              value={field.value ?? []}
              onChange={field.onChange}
            />
          )}
        />
      </FormGroup>
    </Form>
  );
};
