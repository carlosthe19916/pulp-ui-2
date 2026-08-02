import type React from "react";
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

import { useNotifications } from "@app/context/useNotifications";
import { useUserCreateMutation } from "@app/queries/users";

const createUserSchema = yup.object({
  username: yup.string().required("Username is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters"),
  email: yup.string().email("Invalid email address"),
  first_name: yup.string(),
  last_name: yup.string(),
  is_active: yup.boolean(),
  is_staff: yup.boolean(),
});

type CreateUserFormValues = yup.InferType<typeof createUserSchema>;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addNotification } = useNotifications();
  const createMutation = useUserCreateMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: yupResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      first_name: "",
      last_name: "",
      is_active: true,
      is_staff: false,
    },
  });

  register("username");
  register("password");
  register("email");
  register("first_name");
  register("last_name");
  register("is_active");
  register("is_staff");

  const username = watch("username");
  const password = watch("password");
  const email = watch("email");
  const firstName = watch("first_name");
  const lastName = watch("last_name");
  const isActive = watch("is_active");
  const isStaff = watch("is_staff");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync({
        username: values.username,
        password: values.password,
        email: values.email || undefined,
        first_name: values.first_name || undefined,
        last_name: values.last_name || undefined,
        is_active: values.is_active,
        is_staff: values.is_staff,
      });
      addNotification({
        title: "User created",
        variant: "success",
      });
      reset();
      onClose();
    } catch {
      addNotification({
        title: "Failed to create user",
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
      <ModalHeader title="Create User" />
      <ModalBody>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <FormGroup label="Username" isRequired fieldId="username">
            <TextInput
              id="username"
              isRequired
              value={username}
              onChange={(_e, v) =>
                setValue("username", v, { shouldValidate: true })
              }
              validated={errors.username ? "error" : "default"}
            />
            {errors.username && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">
                    {errors.username.message}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>

          <FormGroup label="Password" isRequired fieldId="password">
            <TextInput
              id="password"
              type="password"
              isRequired
              value={password}
              onChange={(_e, v) =>
                setValue("password", v, { shouldValidate: true })
              }
              validated={errors.password ? "error" : "default"}
            />
            {errors.password && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">
                    {errors.password.message}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>

          <FormGroup label="Email" fieldId="email">
            <TextInput
              id="email"
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

          <FormGroup label="First name" fieldId="first_name">
            <TextInput
              id="first_name"
              value={firstName}
              onChange={(_e, v) => setValue("first_name", v)}
            />
          </FormGroup>

          <FormGroup label="Last name" fieldId="last_name">
            <TextInput
              id="last_name"
              value={lastName}
              onChange={(_e, v) => setValue("last_name", v)}
            />
          </FormGroup>

          <FormGroup fieldId="is_active">
            <Checkbox
              id="is_active"
              label="Active"
              isChecked={isActive}
              onChange={(_e, checked) => setValue("is_active", checked)}
            />
          </FormGroup>

          <FormGroup fieldId="is_staff">
            <Checkbox
              id="is_staff"
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
          isLoading={isSubmitting || createMutation.isPending}
          isDisabled={isSubmitting || createMutation.isPending}
        >
          Create
        </Button>
        <Button variant="link" onClick={handleClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
