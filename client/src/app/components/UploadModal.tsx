import type React from "react";
import { useEffect, useMemo } from "react";
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

import {
  TypeaheadSelect,
  type ITypeaheadOption,
} from "@app/components/TypeaheadSelect";
import { useNotifications } from "@app/context/useNotifications";
import { useFileContentCreateMutation } from "@app/queries/file-content";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { notifyTaskStarted } from "@app/utils/taskNotify";

const uploadSchema = yup.object({
  relative_path: yup.string().required("Relative path is required"),
  file: yup.mixed<File>().required("A file is required"),
  repository: yup.string(),
});

type UploadFormValues = yup.InferType<typeof uploadSchema>;

interface IUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositoryHref?: string;
}

export const UploadModal: React.FC<IUploadModalProps> = ({
  isOpen,
  onClose,
  repositoryHref,
}) => {
  const { addNotification } = useNotifications();
  const createMutation = useFileContentCreateMutation();
  const { data: repositoriesData } = useRepositoriesListQuery({ limit: 100 });

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

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormValues>({
    resolver: yupResolver(uploadSchema),
    defaultValues: {
      relative_path: "",
      file: undefined,
      repository: repositoryHref ?? "",
    },
  });

  useEffect(() => {
    reset({
      relative_path: "",
      file: undefined,
      repository: repositoryHref ?? "",
    });
  }, [repositoryHref, reset]);

  const relativePath = watch("relative_path");
  const file = watch("file");
  const repository = watch("repository");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      return;
    }
    setValue("file", selected, { shouldValidate: true });
    if (!relativePath) {
      setValue("relative_path", selected.name, { shouldValidate: true });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!values.file) return;
    try {
      const result = await createMutation.mutateAsync({
        relative_path: values.relative_path,
        file: values.file,
        repository: values.repository || undefined,
      });
      const taskHref = result?.task;
      if (taskHref) {
        notifyTaskStarted(addNotification, taskHref, "Upload started");
      }
    } catch {
      addNotification({
        title: "Failed to upload content",
        variant: "danger",
      });
    }
    reset({
      relative_path: "",
      file: undefined,
      repository: repositoryHref ?? "",
    });
    onClose();
  });

  const handleClose = () => {
    reset({
      relative_path: "",
      file: undefined,
      repository: repositoryHref ?? "",
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} variant="small">
      <ModalHeader title="Upload Content" />
      <ModalBody>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <FormGroup label="File" fieldId="upload-file" isRequired>
            <input id="upload-file" type="file" onChange={handleFileChange} />
            {errors.file && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">
                    {errors.file.message}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          <FormGroup label="Relative Path" fieldId="upload-path" isRequired>
            <TextInput
              id="upload-path"
              value={relativePath ?? ""}
              onChange={(_e, v) =>
                setValue("relative_path", v, { shouldValidate: true })
              }
              placeholder="path/to/file.txt"
              validated={errors.relative_path ? "error" : "default"}
            />
            {errors.relative_path && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">
                    {errors.relative_path.message}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          <FormGroup label="Repository" fieldId="upload-repository">
            <TypeaheadSelect
              id="upload-repository"
              ariaLabel="Repository"
              placeholder="Select a repository (optional)"
              options={repositoryOptions}
              value={repository ?? ""}
              onChange={(value) => setValue("repository", value)}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={() => void onSubmit()}
          isLoading={isSubmitting || createMutation.isPending}
          isDisabled={!file || !relativePath}
        >
          Upload
        </Button>
        <Button variant="link" onClick={handleClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
