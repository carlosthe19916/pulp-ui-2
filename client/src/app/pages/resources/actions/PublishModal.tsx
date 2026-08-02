import type React from "react";
import { useEffect, useMemo } from "react";
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

import {
  TypeaheadSelect,
  type TypeaheadOption,
} from "@app/components/TypeaheadSelect";
import { useNotifications } from "@app/context/useNotifications";
import { useFilePublicationCreateMutation } from "@app/queries/file-publications";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { notifyTaskStarted } from "@app/utils/taskNotify";

const publishSchema = yup.object({
  repository: yup.string(),
  repository_version: yup.string(),
});

type PublishFormValues = yup.InferType<typeof publishSchema>;

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoHref?: string;
  repoVersionHref?: string;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  repoHref,
  repoVersionHref,
}) => {
  const { addNotification } = useNotifications();
  const createMutation = useFilePublicationCreateMutation();
  const { data: repositoriesData } = useRepositoriesListQuery({ limit: 100 });

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

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<PublishFormValues>({
    resolver: yupResolver(publishSchema),
    defaultValues: {
      repository: repoHref ?? "",
      repository_version: repoVersionHref ?? "",
    },
  });

  useEffect(() => {
    reset({
      repository: repoHref ?? "",
      repository_version: repoVersionHref ?? "",
    });
  }, [repoHref, repoVersionHref, reset]);

  const repository = watch("repository");
  const repositoryVersion = watch("repository_version");

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await createMutation.mutateAsync({
        repository: values.repository || undefined,
        repository_version: values.repository_version || undefined,
      });
      const taskHref = result?.task;
      if (taskHref) {
        notifyTaskStarted(addNotification, taskHref, "Publication started");
      }
    } catch {
      addNotification({
        title: "Failed to create publication",
        variant: "danger",
      });
    }
    onClose();
  });

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} variant="small">
      <ModalHeader title="Create Publication" />
      <ModalBody>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <FormGroup label="Repository" fieldId="publish-repo">
            <TypeaheadSelect
              id="publish-repo"
              ariaLabel="Repository"
              placeholder="Select a repository"
              options={repositoryOptions}
              value={repository ?? ""}
              onChange={(value) => setValue("repository", value)}
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
          onClick={() => void onSubmit()}
          isLoading={isSubmitting || createMutation.isPending}
          isDisabled={!repository && !repositoryVersion}
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
