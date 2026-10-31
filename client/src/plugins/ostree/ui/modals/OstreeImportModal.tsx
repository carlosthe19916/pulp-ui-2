import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  Button,
  type DropEvent,
  FileUpload,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Progress,
  TextInput,
} from "@patternfly/react-core";

import { FormSubmitError } from "@app/components/FormSubmitError";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { useArtifactUploadMutation } from "@app/queries/uploads";
import { getMutationErrorMessage } from "@app/utils/utils";
import type { IArchiveImportModalProps } from "@plugin-sdk/ui";

import { useOstreeImportMutation } from "../queries/ostree-repositories";

const importSchema = yup.object({
  file: yup.mixed<File>().required("Select an archive"),
  repository_name: yup.string().trim().required("Enter the repository name"),
  ref: yup.string().trim(),
});

type ImportFormValues = yup.InferType<typeof importSchema>;

/**
 * Imports an OSTree repository archive (a tarball): uploads it as an artifact, then
 * imports every ref, or only one ref's commits, into a new repository version.
 */
export const OstreeImportModal: React.FC<IArchiveImportModalProps> = ({
  repository,
  onClose,
  onStarted,
}) => {
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const artifactMutation = useArtifactUploadMutation();
  const importMutation = useOstreeImportMutation();
  const [progress, setProgress] = useState<number>();

  const {
    handleSubmit,
    register,
    resetField,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ImportFormValues>({
    resolver: yupResolver(importSchema),
    defaultValues: { repository_name: "", ref: "" },
  });
  const file = watch("file");

  const onSubmit = handleSubmit(async (values) => {
    clearSubmitError();
    try {
      const artifact = await artifactMutation.mutateAsync({
        file: values.file,
        onProgress: (fraction) => setProgress(Math.round(fraction * 100)),
      });
      const result = await importMutation.mutateAsync({
        repository,
        body: {
          artifact,
          repository_name: values.repository_name,
          ref: values.ref || undefined,
        },
      });
      onStarted({
        taskHref: result.task,
        repository,
        title: `Importing an archive into "${repository.name}"`,
      });
    } catch (error) {
      setProgress(undefined);
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: `Could not import into "${repository.name}"`,
        }),
      );
      return;
    }
    onClose();
  });

  return (
    <Modal isOpen onClose={onClose} variant="medium">
      <ModalHeader
        title={`Import an archive into "${repository.name}"`}
        description="The archive is a tarball of an OSTree repository. Importing creates a new version."
      />
      <ModalBody>
        <Form
          id="ostree-import-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <FormSubmitError error={submitError} />
          <FormGroup label="Archive" fieldId="ostree-import-file" isRequired>
            <FileUpload
              id="ostree-import-file"
              filename={file?.name ?? ""}
              browseButtonText="Browse"
              onFileInputChange={(_event: DropEvent, picked: File) =>
                setValue("file", picked, { shouldValidate: true })
              }
              onClearClick={() => resetField("file")}
            />
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
          <FormGroup
            label="Repository name"
            fieldId="ostree-import-name"
            isRequired
          >
            <TextInput
              id="ostree-import-name"
              {...register("repository_name")}
              validated={errors.repository_name ? "error" : "default"}
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem
                  variant={errors.repository_name ? "error" : "default"}
                >
                  {errors.repository_name?.message ??
                    "The name of the OSTree repository directory inside the archive."}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
          <FormGroup label="Ref" fieldId="ostree-import-ref">
            <TextInput id="ostree-import-ref" {...register("ref")} />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  Import only the commits of this ref. Leave empty to import
                  every ref.
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
          {progress !== undefined && (
            <Progress
              value={progress}
              title="Uploading the archive"
              aria-label="Archive upload progress"
            />
          )}
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          type="submit"
          form="ostree-import-form"
          isLoading={isSubmitting}
          isDisabled={isSubmitting}
        >
          Import
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
