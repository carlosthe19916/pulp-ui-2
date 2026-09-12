import type React from "react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  Button,
  Checkbox,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import {
  TypeaheadSelect,
  type TypeaheadOption,
} from "@app/components/TypeaheadSelect";
import { useNotifications } from "@app/context/useNotifications";
import { useFileRepositorySyncMutation } from "@app/queries/file-repositories";
import { useRemotesListQuery } from "@app/queries/remotes";
import { notifyTaskStarted } from "@app/utils/taskNotify";

const syncSchema = yup.object({
  remote: yup.string(),
  mirror: yup.boolean(),
});

type SyncFormValues = yup.InferType<typeof syncSchema>;

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoHref: string;
  remoteSuggestion?: string;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  repoHref,
  remoteSuggestion,
}) => {
  const { addNotification } = useNotifications();
  const syncMutation = useFileRepositorySyncMutation();
  const { data: remotesData } = useRemotesListQuery({ limit: 100 });

  const remoteOptions = useMemo<TypeaheadOption[]>(
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
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<SyncFormValues>({
    resolver: yupResolver(syncSchema),
    defaultValues: {
      remote: remoteSuggestion ?? "",
      mirror: false,
    },
  });

  const remote = watch("remote");
  const mirror = watch("mirror");

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await syncMutation.mutateAsync({
        repoHref,
        body: {
          remote: values.remote || undefined,
          mirror: values.mirror,
        },
      });
      const taskHref = result?.task;
      if (taskHref) {
        notifyTaskStarted(addNotification, taskHref, "Sync started");
      }
    } catch {
      addNotification({
        title: "Failed to start sync",
        variant: "danger",
      });
    }
    reset();
    onClose();
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} variant="small">
      <ModalHeader title="Sync Repository" />
      <ModalBody>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <FormGroup label="Remote" fieldId="sync-remote">
            <TypeaheadSelect
              id="sync-remote"
              ariaLabel="Remote"
              placeholder="Select a remote (leave empty for default)"
              options={remoteOptions}
              value={remote ?? ""}
              onChange={(value) => setValue("remote", value)}
            />
          </FormGroup>
          <FormGroup fieldId="sync-mirror">
            <Checkbox
              id="sync-mirror"
              label="Mirror mode"
              isChecked={Boolean(mirror)}
              onChange={(_e, checked) => setValue("mirror", checked)}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={() => void onSubmit()}
          isLoading={isSubmitting || syncMutation.isPending}
          isDisabled={isSubmitting || syncMutation.isPending}
        >
          Sync
        </Button>
        <Button variant="link" onClick={handleClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
