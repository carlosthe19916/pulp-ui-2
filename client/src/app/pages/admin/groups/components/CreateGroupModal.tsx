import type React from "react";
import { useForm } from "react-hook-form";
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

import { useNotifications } from "@app/context/useNotifications";
import { useGroupCreateMutation } from "@app/queries/groups";
import { getMutationErrorMessage } from "@app/utils/utils";

const createGroupSchema = yup.object({
  name: yup.string().required("Name is required"),
});

type CreateGroupFormValues = yup.InferType<typeof createGroupSchema>;

interface ICreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<ICreateGroupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addNotification } = useNotifications();
  const createMutation = useGroupCreateMutation();

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupFormValues>({
    resolver: yupResolver(createGroupSchema),
    defaultValues: { name: "" },
  });

  const name = watch("name");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync({ name: values.name });
      addNotification({
        title: "Group created",
        variant: "success",
      });
      reset();
      onClose();
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to create group"),
        variant: "danger",
      });
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} variant="small">
      <ModalHeader title="Create Group" />
      <ModalBody>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <FormGroup label="Name" isRequired fieldId="group-name">
            <TextInput
              id="group-name"
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
