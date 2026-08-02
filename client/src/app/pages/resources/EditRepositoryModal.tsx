import type React from "react";
import { useEffect, useMemo } from "react";
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
  FileFileRepositoryResponse,
  PatchedfileFileRepository,
} from "@app/client";
import { DescriptorFormFields } from "@app/components/DescriptorFormFields";
import type { TypeaheadOption } from "@app/components/TypeaheadSelect";
import { useNotifications } from "@app/context/useNotifications";
import { fileRepositoryDescriptor } from "@app/descriptors/file/file-repository";
import {
  buildDefaultValues,
  buildFieldSchema,
} from "@app/descriptors/formSchema";
import { useFileRepositoryUpdateMutation } from "@app/queries/file-repositories";
import { useRemotesListQuery } from "@app/queries/remotes";

const editFields = fileRepositoryDescriptor.editFields ?? [];
const editRepositorySchema = buildFieldSchema(editFields);

interface EditRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  repository: FileFileRepositoryResponse;
}

export const EditRepositoryModal: React.FC<EditRepositoryModalProps> = ({
  isOpen,
  onClose,
  repository,
}) => {
  const { addNotification } = useNotifications();
  const updateMutation = useFileRepositoryUpdateMutation();
  const { data: remotesData } = useRemotesListQuery({ limit: 100 });

  const remoteOptions = useMemo<TypeaheadOption[]>(
    () =>
      (remotesData?.results ?? [])
        .filter((remote) => !!remote.pulp_href)
        .map((remote) => ({
          value: remote.pulp_href as string,
          label: remote.name ?? (remote.pulp_href as string),
        })),
    [remotesData?.results],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Record<string, unknown>>({
    resolver: yupResolver(editRepositorySchema),
    defaultValues: buildDefaultValues(editFields, repository),
  });

  useEffect(() => {
    reset(buildDefaultValues(editFields, repository));
  }, [repository, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!repository.pulp_href) return;
    try {
      await updateMutation.mutateAsync({
        href: repository.pulp_href,
        body: values as PatchedfileFileRepository,
      });
      addNotification({
        title: "Repository updated",
        variant: "success",
      });
      onClose();
    } catch {
      addNotification({
        title: "Failed to update repository",
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
      <ModalHeader title={`Edit ${repository.name}`} />
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
            idPrefix="edit-repository"
            resourceOptions={{ remote: remoteOptions }}
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
