import type React from "react";
import { useMemo } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";

import { Form, FormGroup } from "@patternfly/react-core";

import { HookFormPFTextInput } from "@app/components/HookFormPFFields";
import { useAllRolesListQuery } from "@app/queries/roles";

import type { RoleFormValues } from "../hooks/useRoleForm";
import { collectPermissionOptions } from "../../utils/permissionOptions";
import { PermissionMultiSelect } from "./PermissionMultiSelect";

interface IRoleFormProps {
  form: UseFormReturn<RoleFormValues>;
  isCreate: boolean;
  onSubmit: () => void;
  formId: string;
}

export const RoleForm: React.FC<IRoleFormProps> = ({
  form,
  isCreate,
  onSubmit,
  formId,
}) => {
  const { control, watch } = form;
  const { data: rolesData } = useAllRolesListQuery();

  const permissions = watch("permissions");
  const permissionOptions = useMemo(
    () =>
      collectPermissionOptions(
        (rolesData?.results ?? []).map((role) => role.permissions),
        permissions ?? [],
      ),
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
