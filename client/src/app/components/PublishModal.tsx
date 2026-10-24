import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

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

import { FormSubmitError } from "@app/components/FormSubmitError";
import {
  type ITypeaheadOption,
  TypeaheadSelect,
} from "@app/components/TypeaheadSelect";
import { DROPDOWN_PAGE_SIZE } from "@app/constants";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { usePendingCreateRecorder } from "@app/hooks/usePendingCreateRecorder";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { usePublicationCreateMutation } from "@app/queries/publications";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getPlugin } from "@catalog";

const publishSchema = yup.object({
  repository: yup.string(),
  repository_version: yup.string(),
});

type PublishFormValues = yup.InferType<typeof publishSchema>;

interface IPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoHref?: string;
  repoVersionHref?: string;
}

export const PublishModal: React.FC<IPublishModalProps> = ({
  isOpen,
  onClose,
  repoHref,
  repoVersionHref,
}) => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const { recordPendingCreate } = usePendingCreateRecorder({
    entityType: "publication",
  });
  const createMutation = usePublicationCreateMutation();

  const [repoSearch, setRepoSearch] = useState("");
  const debouncedRepoSearch = useDebouncedValue({ value: repoSearch });
  const [selectedRepoLabel, setSelectedRepoLabel] = useState<string>();
  const { data: repositoriesData, isLoading: isReposLoading } =
    useRepositoriesListQuery({
      params: {
        limit: DROPDOWN_PAGE_SIZE,
        offset: 0,
        name__icontains: debouncedRepoSearch || undefined,
      },
    });

  const repositoryOptions: ITypeaheadOption[] = (
    repositoriesData?.results ?? []
  )
    .filter((repo) => !!repo.pulp_href)
    .map((repo) => ({
      value: repo.pulp_href as string,
      label: repo.name ?? (repo.pulp_href as string),
    }));

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<PublishFormValues>({
    resolver: yupResolver(publishSchema),
    defaultValues: {
      repository: repoHref ?? "",
      repository_version: repoVersionHref ?? "",
    },
  });

  const repository = watch("repository");
  const repositoryVersion = watch("repository_version");

  // Resolve the publication endpoint from the *selected* repository's type: its
  // repo plugin names a publication pulp_type (e.g. python.python → python.pypi),
  // whose catalog `apiPath` is the collection to POST to. Follows the selection so
  // changing the repo targets the right endpoint.
  const repoPlugin = repository
    ? getPlugin(resolvePulpType(repository) ?? "")?.entities.repository
    : undefined;
  const publicationType = repoPlugin?.compatiblePublicationTypes[0];
  const publicationApiPath = publicationType
    ? getPlugin(publicationType)?.entities.publication?.apiPath
    : undefined;

  const onSubmit = handleSubmit(async (values) => {
    clearSubmitError();
    if (!publicationApiPath) {
      setSubmitError({
        title: "Failed to create publication",
        description: "This repository type does not support publishing.",
      });
      return;
    }
    try {
      const result = await createMutation.mutateAsync({
        apiPath: publicationApiPath,
        body: {
          repository: values.repository || undefined,
          repository_version: values.repository_version || undefined,
        },
      });
      const taskHref = result?.task;
      if (taskHref) {
        const repositoryName =
          selectedRepoLabel ??
          repositoryOptions.find((option) => option.value === values.repository)
            ?.label;
        notifyTaskStarted({
          addNotification,
          taskHref,
          title: repositoryName
            ? `Publication started for "${repositoryName}"`
            : "Publication started",
        });
        recordPendingCreate({ taskHref, name: repositoryName ?? "" });
      }
    } catch (error) {
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: "Failed to create publication",
        }),
      );
      return;
    }
    onClose();
  });

  const handleClose = () => {
    clearSubmitError();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} variant="small">
      <ModalHeader title="Create Publication" />
      <ModalBody>
        <Form
          id="publish-form"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <FormSubmitError error={submitError} />
          <FormGroup label="Repository" fieldId="publish-repo">
            <TypeaheadSelect
              id="publish-repo"
              ariaLabel="Repository"
              placeholder="Select a repository"
              options={repositoryOptions}
              value={repository ?? ""}
              selectedLabel={selectedRepoLabel}
              isLoading={isReposLoading}
              onFilterChange={setRepoSearch}
              onChange={(value) => {
                setValue("repository", value);
                setSelectedRepoLabel(
                  repositoryOptions.find((option) => option.value === value)
                    ?.label,
                );
              }}
            />
          </FormGroup>
          <FormGroup label="Repository Version" fieldId="publish-version">
            <TextInput
              id="publish-version"
              value={repositoryVersion ?? ""}
              onChange={(_e, v) => setValue("repository_version", v)}
              placeholder="Repository version pulp_href (optional)"
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          type="submit"
          form="publish-form"
          isLoading={isSubmitting || createMutation.isPending}
          isDisabled={
            !publicationApiPath || (!repository && !repositoryVersion)
          }
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
