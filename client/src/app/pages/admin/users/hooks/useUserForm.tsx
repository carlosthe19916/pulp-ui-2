import { useForm, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import type { PatchedUser, UserResponse, UserWritable } from "@app/client";

import { useUserActions } from "./useUserActions";

export type UserFormValues = {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
};

/**
 * Validation is conditional on create vs edit: username and password are only
 * required (and only shown) when creating a user.
 */
const buildUserSchema = (isCreate: boolean) =>
  yup.object({
    username: isCreate
      ? yup.string().default("").required("Username is required")
      : yup.string().default(""),
    password: isCreate
      ? yup
          .string()
          .default("")
          .required("Password is required")
          .min(8, "Password must be at least 8 characters")
      : yup.string().default(""),
    email: yup.string().default("").email("Invalid email address"),
    first_name: yup.string().default(""),
    last_name: yup.string().default(""),
    is_active: yup.boolean().default(true),
    is_staff: yup.boolean().default(false),
  });

const toDefaults = (user?: UserResponse): UserFormValues => ({
  username: user?.username ?? "",
  password: "",
  email: user?.email ?? "",
  first_name: user?.first_name ?? "",
  last_name: user?.last_name ?? "",
  is_active: user?.is_active ?? true,
  is_staff: user?.is_staff ?? false,
});

const emptyToUndefined = (value: string) => value || undefined;

/** Maps form values to the create (POST) payload. */
export const valuesToNewUser = (values: UserFormValues): UserWritable => ({
  username: values.username,
  password: values.password,
  email: emptyToUndefined(values.email),
  first_name: emptyToUndefined(values.first_name),
  last_name: emptyToUndefined(values.last_name),
  is_active: values.is_active,
  is_staff: values.is_staff,
});

/** Maps form values to the edit (PATCH) payload (no username/password). */
export const valuesToPatchedUser = (values: UserFormValues): PatchedUser => ({
  email: emptyToUndefined(values.email),
  first_name: emptyToUndefined(values.first_name),
  last_name: emptyToUndefined(values.last_name),
  is_active: values.is_active,
  is_staff: values.is_staff,
});

interface IUseUserFormArgs {
  user?: UserResponse;
  onClose: () => void;
}

interface IUseUserFormResult {
  form: UseFormReturn<UserFormValues>;
  isCreate: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const useUserForm = ({
  user,
  onClose,
}: IUseUserFormArgs): IUseUserFormResult => {
  const isCreate = !user;
  const { createUser, updateUser } = useUserActions();

  const form = useForm<UserFormValues>({
    resolver: yupResolver(buildUserSchema(isCreate)),
    defaultValues: toDefaults(user),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isCreate) {
        await createUser(valuesToNewUser(values));
      } else if (user?.pulp_href) {
        await updateUser(user.pulp_href, valuesToPatchedUser(values));
      } else {
        return;
      }
      onClose();
    } catch {
      // Notifications are handled in useUserActions; keep the modal open.
    }
  });

  return {
    form,
    isCreate,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
};
