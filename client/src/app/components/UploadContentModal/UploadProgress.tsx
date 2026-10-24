import type React from "react";

import {
  Alert,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
  ProgressStep,
  ProgressStepper,
  type ProgressStepProps,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import type { RepositoryResponse } from "@app/client";

import type { IUploadItem } from "./useUploadQueue";

const ITEM_PROGRESS: Record<
  IUploadItem["status"],
  { variant?: "danger" | "success"; helperText?: string }
> = {
  waiting: { helperText: "Waiting" },
  uploading: {},
  processing: { helperText: "Processing…" },
  done: { variant: "success" },
  failed: { variant: "danger" },
};

interface IUploadProgressProps {
  items: IUploadItem[];
  isRunning: boolean;
  repository?: RepositoryResponse;
  isAdding: boolean;
  isStopping: boolean;
}

/** While and after uploading: steps, each file's progress, and what to decide next. */
export const UploadProgress: React.FC<IUploadProgressProps> = ({
  items,
  isRunning,
  repository,
  isAdding,
  isStopping,
}) => {
  const done = items.filter((item) => item.status === "done");
  const failed = items.filter((item) => item.status === "failed");

  let uploadStep: { title: string; variant: ProgressStepProps["variant"] } = {
    title: "Files uploaded",
    variant: "success",
  };
  if (isRunning) uploadStep = { title: "Uploading files", variant: "info" };
  else if (failed.length) {
    uploadStep = {
      title: `Could not upload ${failed.length} ${failed.length === 1 ? "file" : "files"}`,
      variant: "danger",
    };
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <ProgressStepper aria-label="Upload progress">
          <ProgressStep
            id="upload-step-files"
            titleId="upload-step-files-title"
            variant={uploadStep.variant}
            isCurrent={isRunning}
          >
            {uploadStep.title}
          </ProgressStep>
          {repository && (
            <ProgressStep
              id="upload-step-add"
              titleId="upload-step-add-title"
              variant={isAdding ? "info" : "pending"}
              isCurrent={isAdding}
            >
              {isAdding
                ? `Adding to "${repository.name}"`
                : `Add to "${repository.name}"`}
            </ProgressStep>
          )}
        </ProgressStepper>
      </StackItem>

      <StackItem>
        <MultipleFileUploadStatus
          statusToggleText={`${done.length} of ${items.length} files uploaded`}
          statusToggleIcon={
            uploadStep.variant === "danger"
              ? "danger"
              : isRunning
                ? "inProgress"
                : "success"
          }
        >
          {items.map((item) => (
            <MultipleFileUploadStatusItem
              key={item.id}
              file={item.file}
              fileName={item.fields.relative_path ?? item.file.name}
              customFileHandler={() => undefined}
              progressValue={item.progress}
              progressVariant={ITEM_PROGRESS[item.status].variant}
              progressHelperText={
                item.error ?? ITEM_PROGRESS[item.status].helperText
              }
              buttonAriaLabel={`Remove ${item.file.name}`}
            />
          ))}
        </MultipleFileUploadStatus>
      </StackItem>

      {!isRunning && failed.length > 0 && (
        <StackItem>
          <Alert
            variant="warning"
            isInline
            title={`${done.length} of ${items.length} files are ready. ${failed.length} failed.`}
          >
            {repository
              ? `Nothing has been added to "${repository.name}" yet.`
              : "The files that uploaded are already in Pulp."}
          </Alert>
        </StackItem>
      )}

      {isStopping && (
        <StackItem>
          <Alert variant="warning" isInline title="Stop uploading?">
            The file being uploaded finishes; the rest are skipped. Files
            already uploaded stay in Pulp without a repository.
          </Alert>
        </StackItem>
      )}
    </Stack>
  );
};
