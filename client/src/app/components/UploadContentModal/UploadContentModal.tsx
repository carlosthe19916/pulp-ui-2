import type React from "react";
import { useState } from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import type { RepositoryResponse } from "@app/client";
import { GatedButton } from "@app/components/GatedButton";
import type { useContentChangeTask } from "@app/hooks/useContentChangeTask";
import { useNotifications } from "@app/hooks/useNotifications";
import { useRepositoryActivity } from "@app/hooks/useRepositoryActivity";
import { useRepositoryModifyMutation } from "@app/queries/repositories";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getContentType, type IContentType } from "@catalog";

import { fieldErrors, perFileFields } from "./uploadFields";
import { UploadFilesForm } from "./UploadFilesForm";
import { UploadProgress } from "./UploadProgress";
import { type IUploadItem, useUploadQueue } from "./useUploadQueue";

interface IUploadContentModalProps {
  /** The content types that can be uploaded here. */
  contentTypes: IContentType[];
  /** Inside a repository page: the target, not shown as a field. */
  repository?: RepositoryResponse;
  onClose: () => void;
  /** The uploaded content was sent to the repository: the page follows the change. */
  onStarted: ReturnType<typeof useContentChangeTask>["watch"];
}

/**
 * Uploads files as content one by one (large files in chunks), then adds them to the
 * repository in one change; pauses first if any failed.
 */
export const UploadContentModal: React.FC<IUploadContentModalProps> = ({
  contentTypes,
  repository: inferredRepository,
  onClose,
  onStarted,
}) => {
  const { addNotification } = useNotifications();
  const [pulpType, setPulpType] = useState(contentTypes[0]?.pulpType ?? "");
  const contentType = getContentType(pulpType);
  const queue = useUploadQueue({
    apiPath: contentType?.apiPath ?? "",
    mechanism: contentType?.uploadable?.mechanism ?? "upload",
    defaultFields: (file) =>
      Object.fromEntries(
        perFileFields(contentType).map((field) => [
          field.key,
          field.key === "relative_path" ? file.name : "",
        ]),
      ),
  });
  const [chosenRepository, setChosenRepository] =
    useState<RepositoryResponse>();
  const repository = inferredRepository ?? chosenRepository;
  const { lockedProps } = useRepositoryActivity({ repository });
  const [hasStarted, setHasStarted] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const modifyMutation = useRepositoryModifyMutation({
    onSuccess: (data, variables) =>
      onStarted({ taskHref: data.task, ...variables }),
    onError: (error, variables) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Could not add the uploaded files to "${variables.repository.name}"`,
        }),
        variant: "danger",
      }),
  });

  const { items } = queue;
  const errors = fieldErrors({ items, contentType });
  const doneCount = items.filter((item) => item.status === "done").length;
  const hasFailed = items.some((item) => item.status === "failed");

  const finish = (batch: IUploadItem[]) => {
    const hrefs = batch.flatMap((item) =>
      item.status === "done" && item.contentHref ? [item.contentHref] : [],
    );
    if (repository) {
      modifyMutation.mutate(
        { repository, body: { add_content_units: hrefs } },
        { onSuccess: onClose },
      );
      return;
    }
    addNotification({
      title: `${hrefs.length} content ${hrefs.length === 1 ? "unit" : "units"} created`,
      variant: "success",
    });
    onClose();
  };
  // When every file uploaded, finish without asking; otherwise pause.
  const finishIfAllDone = (batch: IUploadItem[]) => {
    if (batch.every((item) => item.status === "done")) finish(batch);
  };

  let phase: "pick" | "running" | "partial" | "stopping" | "adding" = "adding";
  if (!hasStarted) phase = "pick";
  else if (isStopping) phase = "stopping";
  else if (queue.isRunning) phase = "running";
  else if (hasFailed) phase = "partial";

  const footer = {
    pick: (
      <>
        <GatedButton
          variant="primary"
          isDisabled={items.length === 0 || errors.size > 0}
          onClick={() => {
            setHasStarted(true);
            void queue.start().then(finishIfAllDone);
          }}
          {...lockedProps}
        >
          Upload
        </GatedButton>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </>
    ),
    running: (
      <Button variant="link" onClick={() => setIsStopping(true)}>
        Cancel upload
      </Button>
    ),
    stopping: (
      <>
        <Button
          variant="primary"
          onClick={() => {
            queue.stop();
            onClose();
          }}
        >
          Stop
        </Button>
        <Button variant="link" onClick={() => setIsStopping(false)}>
          Keep uploading
        </Button>
      </>
    ),
    partial: (
      <>
        <Button
          variant="primary"
          onClick={() => void queue.retryFailed().then(finishIfAllDone)}
        >
          Retry failed
        </Button>
        {doneCount > 0 && (
          <GatedButton
            variant="secondary"
            isLoading={modifyMutation.isPending}
            isDisabled={modifyMutation.isPending}
            onClick={() => finish(items)}
            {...lockedProps}
          >
            {repository ? `Add ${doneCount} to "${repository.name}"` : "Done"}
          </GatedButton>
        )}
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </>
    ),
    adding: (
      <>
        {modifyMutation.isError && (
          <GatedButton
            variant="primary"
            onClick={() => finish(items)}
            {...lockedProps}
          >
            Retry
          </GatedButton>
        )}
        <Button variant="link" onClick={onClose}>
          Close
        </Button>
      </>
    ),
  }[phase];

  return (
    <Modal
      isOpen
      onClose={queue.isRunning ? () => setIsStopping(true) : onClose}
      variant="medium"
    >
      <ModalHeader
        title={
          inferredRepository
            ? `Upload content to "${inferredRepository.name}"`
            : "Upload content"
        }
        description={
          repository
            ? `All files are added in one change, which creates a new version of "${repository.name}".`
            : undefined
        }
      />
      <ModalBody>
        {hasStarted ? (
          <UploadProgress
            items={items}
            isRunning={queue.isRunning}
            repository={repository}
            isAdding={modifyMutation.isPending}
            isStopping={isStopping}
          />
        ) : (
          <UploadFilesForm
            contentTypes={contentTypes}
            pulpType={pulpType}
            onPulpTypeChange={setPulpType}
            queue={queue}
            errors={errors}
            repositoryPicker={
              inferredRepository
                ? undefined
                : { value: chosenRepository, onChange: setChosenRepository }
            }
          />
        )}
      </ModalBody>
      <ModalFooter>{footer}</ModalFooter>
    </Modal>
  );
};
