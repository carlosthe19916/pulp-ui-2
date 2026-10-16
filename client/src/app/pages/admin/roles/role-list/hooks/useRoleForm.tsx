import { useForm, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import type { PatchedRole, Role, RoleResponse } from "@app/client";
import { useNotifications } from "@app/context/useNotifications";
import {
  useRoleCreateMutation,
  useRoleUpdateMutation,
} from "@app/queries/roles";
import { getMutationErrorMessage } from "@app/utils/utils";

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

export const valuesToNewRole = (values: RoleFormValues): Role => ({
  name: values.name,
  description: values.description || undefined,
  permissions: values.permissions ?? [],
});

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
  const { addNotification } = useNotifications();
  const isCreate = !role;

  const createMutation = useRoleCreateMutation({
    onSuccess: (data) =>
      addNotification({
        title: `Role "${data.name}" created`,
        variant: "success",
      }),
    onError: (error) =>
      addNotification({
        ...getMutationErrorMessage(error, "Failed to create role"),
        variant: "danger",
      }),
  });
  const updateMutation = useRoleUpdateMutation({
    onSuccess: (_data, { name }) =>
      addNotification({ title: `Role "${name}" updated`, variant: "success" }),
    onError: (error) =>
      addNotification({
        ...getMutationErrorMessage(error, "Failed to update role"),
        variant: "danger",
      }),
  });

  const form = useForm<RoleFormValues>({
    resolver: yupResolver(buildRoleSchema(isCreate)),
    defaultValues: toDefaults(role),
    mode: "onChange",
  });

  const onSubmit = form.handleSubmit((values) => {
    if (isCreate) {
      createMutation.mutate(valuesToNewRole(values), {
        onSuccess: () => onClose(),
      });
    } else if (role?.pulp_href) {
      updateMutation.mutate(
        {
          href: role.pulp_href,
          name: role.name ?? "",
          body: valuesToPatchedRole(values),
        },
        { onSuccess: () => onClose() },
      );
    }
  });

  return {
    form,
    isCreate,
    onSubmit,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  };
};
