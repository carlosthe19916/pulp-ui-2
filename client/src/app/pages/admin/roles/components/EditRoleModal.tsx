import type React from "react";
import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  Button,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from "@patternfly/react-core";

import type { RoleResponse } from "@app/client";
import { PermissionMultiSelect } from "./PermissionMultiSelect";
import { useNotifications } from "@app/context/useNotifications";
import { useRolesListQuery, useRoleUpdateMutation } from "@app/queries/roles";
import { collectPermissionOptions } from "../utils/permissionOptions";
import { getMutationErrorMessage } from "@app/utils/utils";

const editRoleSchema = yup.object({
  description: yup.string(),
  permissions: yup.array().of(yup.string().required()).default([]),
});

type EditRoleFormValues = yup.InferType<typeof editRoleSchema>;

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleResponse;
}

export const EditRoleModal: React.FC<EditRoleModalProps> = ({
  isOpen,
  onClose,
  role,
}) => {
  const { addNotification } = useNotifications();
  const updateMutation = useRoleUpdateMutation();
  const { data: rolesData } = useRolesListQuery({ limit: 200 });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<EditRoleFormValues>({
    resolver: yupResolver(editRoleSchema),
    defaultValues: {
      description: role.description ?? "",
      permissions: role.permissions ?? [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        description: role.description ?? "",
        permissions: role.permissions ?? [],
      });
    }
  }, [isOpen, reset, role]);

  const description = watch("description");
  const permissions = watch("permissions");

  const permissionOptions = useMemo(
    () =>
      collectPermissionOptions(
        (rolesData?.results ?? []).map((item) => item.permissions),
        permissions ?? [],
      ),
    [permissions, rolesData?.results],
  );

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        href: role.pulp_href ?? "",
        body: {
          description: values.description || undefined,
          permissions: values.permissions ?? [],
        },
      });
      addNotification({
        title: `Role "${role.name}" updated`,
        variant: "success",
      });
      onClose();
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to update role"),
        variant: "danger",
      });
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="medium">
      <ModalHeader title={`Edit Role: ${role.name}`} />
      <ModalBody>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <FormGroup label="Name" fieldId="edit-role-name">
            <TextInput id="edit-role-name" value={role.name} isDisabled />
          </FormGroup>
          <FormGroup label="Description" fieldId="edit-role-description">
            <TextInput
              id="edit-role-description"
              value={description}
              onChange={(_e, value) => setValue("description", value)}
            />
          </FormGroup>
          <FormGroup label="Permissions" fieldId="edit-role-permissions">
            <Controller
              name="permissions"
              control={control}
              render={({ field }) => (
                <PermissionMultiSelect
                  id="edit-role-permissions"
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
          isDisabled={isSubmitting || updateMutation.isPending}
          isLoading={isSubmitting || updateMutation.isPending}
        >
          Save
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
