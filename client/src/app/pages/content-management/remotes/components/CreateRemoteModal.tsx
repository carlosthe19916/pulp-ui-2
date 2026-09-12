import type React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  Button,
  Form,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import type { FileFileRemoteWritable } from "@app/client";
import { DescriptorFormFields } from "@app/components/DescriptorFormFields";
import { useNotifications } from "@app/context/useNotifications";
import { fileRemoteDescriptor } from "@app/descriptors/file/file-remote";
import {
  buildDefaultValues,
  buildFieldSchema,
  cleanFormValues,
} from "@app/descriptors/formSchema";
import { useFileRemoteCreateMutation } from "@app/queries/file-remotes";
import { getMutationErrorMessage } from "@app/utils/utils";

const createFields = fileRemoteDescriptor.createFields ?? [];
const createRemoteSchema = buildFieldSchema(createFields);

interface ICreateRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRemoteModal: React.FC<ICreateRemoteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addNotification } = useNotifications();
  const createMutation = useFileRemoteCreateMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Record<string, unknown>>({
    resolver: yupResolver(createRemoteSchema),
    defaultValues: buildDefaultValues(createFields),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const body = cleanFormValues<FileFileRemoteWritable>(values);
      await createMutation.mutateAsync(body);
      addNotification({
        title: "Remote created",
        variant: "success",
      });
      reset(buildDefaultValues(createFields));
      onClose();
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to create remote"),
        variant: "danger",
      });
    }
  });

  const handleClose = () => {
    reset(buildDefaultValues(createFields));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} variant="medium">
      <ModalHeader title="Create Remote" />
      <ModalBody>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <DescriptorFormFields
            fields={createFields}
            control={control}
            idPrefix="create-remote"
          />
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
