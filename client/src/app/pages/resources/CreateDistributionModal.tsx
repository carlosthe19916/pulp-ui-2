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

import type { FileFileDistribution } from "@app/client";
import { DescriptorFormFields } from "@app/components/DescriptorFormFields";
import type { TypeaheadOption } from "@app/components/TypeaheadSelect";
import { useNotifications } from "@app/context/useNotifications";
import { fileDistributionDescriptor } from "@app/descriptors/file/file-distribution";
import {
  buildDefaultValues,
  buildFieldSchema,
  cleanFormValues,
} from "@app/descriptors/formSchema";
import { useFileDistributionCreateMutation } from "@app/queries/file-distributions";
import { usePublicationsListQuery } from "@app/queries/publications";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { extractIdFromHref } from "@app/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

const createFields = fileDistributionDescriptor.createFields ?? [];
const createDistributionSchema = buildFieldSchema(createFields);

interface CreateDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateDistributionModal: React.FC<
  CreateDistributionModalProps
> = ({ isOpen, onClose }) => {
  const { addNotification } = useNotifications();
  const createMutation = useFileDistributionCreateMutation();
  const { data: repositoriesData } = useRepositoriesListQuery({ limit: 100 });
  const { data: publicationsData } = usePublicationsListQuery({ limit: 100 });

  const repositoryOptions = useMemo<TypeaheadOption[]>(
    () =>
      (repositoriesData?.results ?? [])
        .filter((repo) => !!repo.pulp_href)
        .map((repo) => ({
          value: repo.pulp_href as string,
          label: repo.name ?? (repo.pulp_href as string),
        })),
    [repositoriesData?.results],
  );

  const publicationOptions = useMemo<TypeaheadOption[]>(
    () =>
      (publicationsData?.results ?? [])
        .filter((pub) => !!pub.pulp_href)
        .map((pub) => ({
          value: pub.pulp_href as string,
          label: `Publication ${extractIdFromHref(pub.pulp_href as string)}`,
        })),
    [publicationsData?.results],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Record<string, unknown>>({
    resolver: yupResolver(createDistributionSchema),
    defaultValues: buildDefaultValues(createFields),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const body = cleanFormValues<FileFileDistribution>(values);
      const result = await createMutation.mutateAsync(body);
      if (result?.task) {
        notifyTaskStarted(
          addNotification,
          result.task,
          "Distribution creation started",
        );
      } else {
        addNotification({ title: "Distribution created", variant: "success" });
      }
      reset(buildDefaultValues(createFields));
      onClose();
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to create distribution"),
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
      <ModalHeader title="Create Distribution" />
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
            idPrefix="create-distribution"
            resourceOptions={{
              repository: repositoryOptions,
              publication: publicationOptions,
            }}
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
