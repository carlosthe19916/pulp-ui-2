import type React from "react";
import { useMemo, useState } from "react";
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

import type { FileFilePublication } from "@app/client";
import { DescriptorFormFields } from "@app/components/DescriptorFormFields";
import type { ITypeaheadOption } from "@app/components/TypeaheadSelect";
import { useNotifications } from "@app/context/useNotifications";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { filePublicationDescriptor } from "@app/descriptors/file/file-publication";
import {
  buildDefaultValues,
  buildFieldSchema,
  cleanFormValues,
} from "@app/descriptors/formSchema";
import { useFilePublicationCreateMutation } from "@app/queries/file-publications";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

const createFields = filePublicationDescriptor.createFields ?? [];
const createPublicationSchema = buildFieldSchema(createFields);

interface ICreatePublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoHref?: string;
}

export const CreatePublicationModal: React.FC<ICreatePublicationModalProps> = ({
  isOpen,
  onClose,
  repoHref,
}) => {
  const { addNotification } = useNotifications();
  const createMutation = useFilePublicationCreateMutation();
  const [repoSearch, setRepoSearch] = useState("");
  const debouncedRepoSearch = useDebouncedValue(repoSearch);
  const { data: repositoriesData, isLoading: isReposLoading } =
    useRepositoriesListQuery({
      limit: 20,
      name__icontains: debouncedRepoSearch || undefined,
    });

  const repositoryOptions = useMemo<ITypeaheadOption[]>(
    () =>
      (repositoriesData?.results ?? [])
        .filter((repo) => !!repo.pulp_href)
        .map((repo) => ({
          value: repo.pulp_href as string,
          label: repo.name ?? (repo.pulp_href as string),
        })),
    [repositoriesData?.results],
  );

  const defaultValues = useMemo(
    () =>
      buildDefaultValues(
        createFields,
        repoHref ? { repository: repoHref } : undefined,
      ),
    [repoHref],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Record<string, unknown>>({
    resolver: yupResolver(createPublicationSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const body = cleanFormValues<FileFilePublication>(values);
      const repositoryHref =
        typeof values.repository === "string" ? values.repository : undefined;
      const repositoryName = repositoryHref
        ? (repositoryOptions.find((o) => o.value === repositoryHref)?.label ??
          extractIdFromHref(repositoryHref))
        : undefined;
      const result = await createMutation.mutateAsync(body);
      if (result?.task) {
        notifyTaskStarted(
          addNotification,
          result.task,
          repositoryName
            ? `Publication started for "${repositoryName}"`
            : "Publication started",
        );
      } else {
        addNotification({
          title: repositoryName
            ? `Publication created for "${repositoryName}"`
            : "Publication created",
          variant: "success",
        });
      }
      reset(defaultValues);
      onClose();
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to create publication"),
        variant: "danger",
      });
    }
  });

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} variant="medium">
      <ModalHeader title="Create Publication" />
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
            idPrefix="create-publication"
            resourceOptions={{ repository: repositoryOptions }}
            resourceSearch={{
              repository: {
                onFilterChange: setRepoSearch,
                isLoading: isReposLoading,
              },
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
          Publish
        </Button>
        <Button variant="link" onClick={handleClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
