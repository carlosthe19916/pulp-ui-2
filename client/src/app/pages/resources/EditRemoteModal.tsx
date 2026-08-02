import type React from "react";
import { useEffect } from "react";
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

import type {
  FileFileRemoteResponse,
  PatchedfileFileRemoteWritable,
} from "@app/client";
import { DescriptorFormFields } from "@app/components/DescriptorFormFields";
import { useNotifications } from "@app/context/useNotifications";
import { fileRemoteDescriptor } from "@app/descriptors/file/file-remote";
import {
  buildDefaultValues,
  buildFieldSchema,
} from "@app/descriptors/formSchema";
import { useFileRemoteUpdateMutation } from "@app/queries/file-remotes";

const editFields = fileRemoteDescriptor.editFields ?? [];
const editRemoteSchema = buildFieldSchema(editFields);

interface EditRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  remote: FileFileRemoteResponse;
}

export const EditRemoteModal: React.FC<EditRemoteModalProps> = ({
  isOpen,
  onClose,
  remote,
}) => {
  const { addNotification } = useNotifications();
  const updateMutation = useFileRemoteUpdateMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Record<string, unknown>>({
    resolver: yupResolver(editRemoteSchema),
    defaultValues: buildDefaultValues(
      editFields,
      remote as unknown as Record<string, unknown>,
    ),
  });

  useEffect(() => {
    reset(
      buildDefaultValues(
        editFields,
        remote as unknown as Record<string, unknown>,
      ),
    );
  }, [remote, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!remote.pulp_href) return;
    try {
      await updateMutation.mutateAsync({
        href: remote.pulp_href,
        body: values as PatchedfileFileRemoteWritable,
      });
      addNotification({
        title: "Remote updated",
        variant: "success",
      });
      onClose();
    } catch {
      addNotification({
        title: "Failed to update remote",
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
      <ModalHeader title={`Edit ${remote.name}`} />
      <ModalBody>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <DescriptorFormFields
            fields={editFields}
            control={control}
            idPrefix="edit-remote"
          />
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
