import type React from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  Button,
  Checkbox,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from "@patternfly/react-core";

import type { UserResponse } from "@app/client";
import { useNotifications } from "@app/context/useNotifications";
import { useUserUpdateMutation } from "@app/queries/users";

const editUserSchema = yup.object({
  email: yup.string().email("Invalid email address"),
  first_name: yup.string(),
  last_name: yup.string(),
  is_active: yup.boolean(),
  is_staff: yup.boolean(),
});

type EditUserFormValues = yup.InferType<typeof editUserSchema>;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserResponse;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const { addNotification } = useNotifications();
  const updateMutation = useUserUpdateMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormValues>({
    resolver: yupResolver(editUserSchema),
    defaultValues: {
      email: user.email ?? "",
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      is_active: user.is_active ?? true,
      is_staff: user.is_staff ?? false,
    },
  });

  useEffect(() => {
    reset({
      email: user.email ?? "",
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      is_active: user.is_active ?? true,
      is_staff: user.is_staff ?? false,
    });
  }, [user, reset]);

  register("email");
  register("first_name");
  register("last_name");
  register("is_active");
  register("is_staff");

  const email = watch("email");
  const firstName = watch("first_name");
  const lastName = watch("last_name");
  const isActive = watch("is_active");
  const isStaff = watch("is_staff");

  const onSubmit = handleSubmit(async (values) => {
    if (!user.pulp_href) return;
    try {
      await updateMutation.mutateAsync({
        href: user.pulp_href,
        body: {
          email: values.email || undefined,
          first_name: values.first_name || undefined,
          last_name: values.last_name || undefined,
          is_active: values.is_active,
          is_staff: values.is_staff,
        },
      });
      addNotification({
        title: "User updated",
        variant: "success",
      });
      onClose();
    } catch {
      addNotification({
        title: "Failed to update user",
        variant: "danger",
      });
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} variant="medium">
      <ModalHeader title={`Edit ${user.username}`} />
      <ModalBody>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <FormGroup label="Email" fieldId="edit-email">
            <TextInput
              id="edit-email"
              type="email"
              value={email}
              onChange={(_e, v) =>
                setValue("email", v, { shouldValidate: true })
              }
              validated={errors.email ? "error" : "default"}
            />
            {errors.email && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">
                    {errors.email.message}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>

          <FormGroup label="First name" fieldId="edit-first_name">
            <TextInput
              id="edit-first_name"
              value={firstName}
              onChange={(_e, v) => setValue("first_name", v)}
            />
          </FormGroup>

          <FormGroup label="Last name" fieldId="edit-last_name">
            <TextInput
              id="edit-last_name"
              value={lastName}
              onChange={(_e, v) => setValue("last_name", v)}
            />
          </FormGroup>

          <FormGroup fieldId="edit-is_active">
            <Checkbox
              id="edit-is_active"
              label="Active"
              isChecked={isActive}
              onChange={(_e, checked) => setValue("is_active", checked)}
            />
          </FormGroup>

          <FormGroup fieldId="edit-is_staff">
            <Checkbox
              id="edit-is_staff"
              label="Staff status"
              isChecked={isStaff}
              onChange={(_e, checked) => setValue("is_staff", checked)}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={() => void onSubmit()}
          isLoading={isSubmitting || updateMutation.isPending}
          isDisabled={isSubmitting || updateMutation.isPending}
        >
          Save
        </Button>
        <Button variant="link" onClick={handleClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
