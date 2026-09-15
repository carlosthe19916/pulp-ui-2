import { useForm, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import type { PatchedRole, Role, RoleResponse } from "@app/client";

import { useRoleActions } from "./useRoleActions";

export type RoleFormValues = {
  name: string;
  description: string;
  permissions: string[];
};

/** Name is required (and editable) only when creating a role. */
const buildRoleSchema = (isCreate: boolean) =>
  yup.object({
    name: isCreate
      ? yup.string().default("").required("Name is required")
      : yup.string().default(""),
    description: yup.string().default(""),
    permissions: yup.array(yup.string().required()).default([]),
  });

const toDefaults = (role?: RoleResponse): RoleFormValues => ({
  name: role?.name ?? "",
  description: role?.description ?? "",
  permissions: role?.permissions ?? [],
});

/** Maps form values to the create (POST) payload. */
export const valuesToNewRole = (values: RoleFormValues): Role => ({
  name: values.name,
  description: values.description || undefined,
  permissions: values.permissions ?? [],
});

/** Maps form values to the edit (PATCH) payload (no name). */
export const valuesToPatchedRole = (values: RoleFormValues): PatchedRole => ({
  description: values.description || undefined,
  permissions: values.permissions ?? [],
});

interface IUseRoleFormArgs {
  role?: RoleResponse;
  onClose: () => void;
}

interface IUseRoleFormResult {
  form: UseFormReturn<RoleFormValues>;
  isCreate: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const useRoleForm = ({
  role,
  onClose,
}: IUseRoleFormArgs): IUseRoleFormResult => {
  const isCreate = !role;
  const { createRole, updateRole } = useRoleActions();

  const form = useForm<RoleFormValues>({
    resolver: yupResolver(buildRoleSchema(isCreate)),
    defaultValues: toDefaults(role),
    mode: "onChange",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isCreate) {
        await createRole(valuesToNewRole(values));
      } else if (role?.pulp_href) {
        await updateRole(role.pulp_href, valuesToPatchedRole(values));
      } else {
        return;
      }
      onClose();
    } catch {
      // Notifications are handled in useRoleActions; keep the modal open.
    }
  });

  return {
    form,
    isCreate,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
};
