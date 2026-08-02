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
  FileFileDistributionResponse,
  PatchedfileFileDistribution,
} from "@app/client";
import { DescriptorFormFields } from "@app/components/DescriptorFormFields";
import type { TypeaheadOption } from "@app/components/TypeaheadSelect";
import { useNotifications } from "@app/context/useNotifications";
import { fileDistributionDescriptor } from "@app/descriptors/file/file-distribution";
import {
  buildDefaultValues,
  buildFieldSchema,
} from "@app/descriptors/formSchema";
import { useFileDistributionUpdateMutation } from "@app/queries/file-distributions";
import { usePublicationsListQuery } from "@app/queries/publications";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { extractIdFromHref } from "@app/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";

const editFields = fileDistributionDescriptor.editFields ?? [];
const editDistributionSchema = buildFieldSchema(editFields);

interface EditDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  distribution: FileFileDistributionResponse;
}

export const EditDistributionModal: React.FC<EditDistributionModalProps> = ({
  isOpen,
  onClose,
  distribution,
}) => {
  const { addNotification } = useNotifications();
  const updateMutation = useFileDistributionUpdateMutation();
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
    resolver: yupResolver(editDistributionSchema),
    defaultValues: buildDefaultValues(editFields, distribution),
  });

  useEffect(() => {
    reset(buildDefaultValues(editFields, distribution));
  }, [distribution, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!distribution.pulp_href) return;
    try {
      const result = await updateMutation.mutateAsync({
        href: distribution.pulp_href,
        body: values as PatchedfileFileDistribution,
      });
      const taskHref = result && "task" in result ? result.task : undefined;
      if (taskHref) {
        notifyTaskStarted(
          addNotification,
          taskHref,
          "Distribution update started",
        );
      } else {
        addNotification({ title: "Distribution updated", variant: "success" });
      }
      onClose();
    } catch {
      addNotification({
        title: "Failed to update distribution",
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
      <ModalHeader title={`Edit ${distribution.name}`} />
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
            idPrefix="edit-distribution"
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
