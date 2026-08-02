import type React from "react";
import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  Button,
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

import { PermissionMultiSelect } from "@app/components/PermissionMultiSelect";
import { useNotifications } from "@app/context/useNotifications";
import { useRoleCreateMutation, useRolesListQuery } from "@app/queries/roles";
import { collectPermissionOptions } from "@app/utils/permissionOptions";
import { getMutationErrorMessage } from "@app/utils/utils";

const createRoleSchema = yup.object({
  name: yup.string().required("Name is required"),
  description: yup.string(),
  permissions: yup.array().of(yup.string().required()).default([]),
});

type CreateRoleFormValues = yup.InferType<typeof createRoleSchema>;

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addNotification } = useNotifications();
  const createMutation = useRoleCreateMutation();
  const { data: rolesData } = useRolesListQuery({ limit: 200 });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoleFormValues>({
    resolver: yupResolver(createRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  const name = watch("name");
  const description = watch("description");
  const permissions = watch("permissions");

  const permissionOptions = useMemo(
    () =>
      collectPermissionOptions(
        (rolesData?.results ?? []).map((role) => role.permissions),
        permissions ?? [],
      ),
    [permissions, rolesData?.results],
  );

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        permissions: values.permissions ?? [],
      });
      addNotification({
        title: `Role "${values.name}" created`,
        variant: "success",
      });
      reset();
      onClose();
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to create role"),
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
      <ModalHeader title="Create Role" />
      <ModalBody>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <FormGroup label="Name" isRequired fieldId="role-name">
            <TextInput
              id="role-name"
              value={name}
              onChange={(_e, value) =>
                setValue("name", value, { shouldValidate: true })
              }
              isRequired
              validated={errors.name ? "error" : "default"}
            />
            {errors.name && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">
                    {errors.name.message}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          <FormGroup label="Description" fieldId="role-description">
            <TextInput
              id="role-description"
              value={description}
              onChange={(_e, value) => setValue("description", value)}
            />
          </FormGroup>
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
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={() => void onSubmit()}
          isDisabled={isSubmitting || createMutation.isPending}
          isLoading={isSubmitting || createMutation.isPending}
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
