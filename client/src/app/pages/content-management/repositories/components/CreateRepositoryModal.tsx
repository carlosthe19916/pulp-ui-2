import type React from "react";
import { useMemo } from "react";
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

import type { FileFileRepository } from "@app/client";
import { DescriptorFormFields } from "@app/components/DescriptorFormFields";
import type { ITypeaheadOption } from "@app/components/TypeaheadSelect";
import { useNotifications } from "@app/context/useNotifications";
import { fileRepositoryDescriptor } from "@app/descriptors/file/file-repository";
import {
  buildDefaultValues,
  buildFieldSchema,
  cleanFormValues,
} from "@app/descriptors/formSchema";
import { useFileRepositoryCreateMutation } from "@app/queries/file-repositories";
import { useRemotesListQuery } from "@app/queries/remotes";
import { getMutationErrorMessage } from "@app/utils/utils";

const createFields = fileRepositoryDescriptor.createFields ?? [];
const createRepositorySchema = buildFieldSchema(createFields);

interface ICreateRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRepositoryModal: React.FC<ICreateRepositoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addNotification } = useNotifications();
  const createMutation = useFileRepositoryCreateMutation();
  const { data: remotesData } = useRemotesListQuery({ limit: 100 });

  const remoteOptions = useMemo<ITypeaheadOption[]>(
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
    resolver: yupResolver(createRepositorySchema),
    defaultValues: buildDefaultValues(createFields),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const body = cleanFormValues<FileFileRepository>(values);
      await createMutation.mutateAsync(body);
      addNotification({
        title: "Repository created",
        variant: "success",
      });
      reset(buildDefaultValues(createFields));
      onClose();
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to create repository"),
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
      <ModalHeader title="Create Repository" />
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
            idPrefix="create-repository"
            resourceOptions={{ remote: remoteOptions }}
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
