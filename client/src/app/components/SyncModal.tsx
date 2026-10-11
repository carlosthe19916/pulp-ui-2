import type React from "react";
import { useMemo, useState } from "react";
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

import type { RepositoryResponse } from "@app/client";
import {
  TypeaheadSelect,
  type ITypeaheadOption,
} from "@app/components/TypeaheadSelect";
import { getPlugin } from "@catalog";
import { useNotifications } from "@app/context/useNotifications";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import type { WithId } from "@app/models/models";
import { useRemotesListQuery } from "@app/queries/remotes";
import {
  useRepositorySyncMutation,
  type RepositorySyncBody,
} from "@app/queries/repositories";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";

const syncSchema = yup.object({
  remote: yup.string(),
  mirror: yup.boolean(),
});

type SyncFormValues = yup.InferType<typeof syncSchema>;

interface ISyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: WithId<RepositoryResponse>;
}

export const SyncModal: React.FC<ISyncModalProps> = ({
  isOpen,
  onClose,
  repo,
}) => {
  const { addNotification } = useNotifications();
  const syncMutation = useRepositorySyncMutation();

  const repoPulpType = resolvePulpType(repo.object.pulp_href);

  const repoPlugin = repoPulpType
    ? getPlugin(repoPulpType)?.entities.repository
    : undefined;

  // Collection sub-path used to rebuild the sync endpoint client-side (e.g.
  // "python/python") — no reliance on the server-provided pulp_href.
  const apiPath = repoPlugin?.apiPath;
  // Remote types this repository can sync from (scopes the remote picker).
  const compatibleRemoteTypes = repoPlugin?.compatibleRemoteTypes ?? [];

  const [remoteSearch, setRemoteSearch] = useState("");
  const debouncedRemoteSearch = useDebouncedValue(remoteSearch);
  const [selectedRemoteLabel, setSelectedRemoteLabel] = useState<string>();
  const { data: remotesData, isLoading: isRemotesLoading } =
    useRemotesListQuery({
      limit: 20,
      name__icontains: debouncedRemoteSearch || undefined,
      pulp_type__in: compatibleRemoteTypes.length
        ? (compatibleRemoteTypes as NonNullable<
            Parameters<typeof useRemotesListQuery>[0]
          >["pulp_type__in"])
        : undefined,
    });

  const remoteOptions = useMemo<ITypeaheadOption[]>(
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
      remote: repo.object.remote ?? "",
      mirror: false,
    },
  });

  const remote = watch("remote");
  const mirror = watch("mirror");

  const onSubmit = handleSubmit(async (values) => {
    if (!apiPath) {
      addNotification({
        title: "Failed to start sync",
        description: "This repository type does not support syncing.",
        variant: "danger",
      });
      return;
    }
    const body: RepositorySyncBody = {
      remote: values.remote || undefined,
      mirror: values.mirror,
    };
    try {
      const result = await syncMutation.mutateAsync({
        apiPath,
        id: repo.id,
        body,
      });
      const taskHref = result?.task;
      if (taskHref) {
        const remoteName =
          selectedRemoteLabel ??
          remoteOptions.find((option) => option.value === values.remote)?.label;
        notifyTaskStarted(
          addNotification,
          taskHref,
          remoteName
            ? `Sync started from remote "${remoteName}"`
            : "Sync started",
        );
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
      <ModalHeader title={`Sync repository "${repo.object.name}"`} />
      <ModalBody>
        <Form
          id="sync-form"
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
              selectedLabel={selectedRemoteLabel}
              isLoading={isRemotesLoading}
              onFilterChange={setRemoteSearch}
              onChange={(value) => {
                setValue("remote", value);
                setSelectedRemoteLabel(
                  remoteOptions.find((option) => option.value === value)?.label,
                );
              }}
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
          type="submit"
          form="sync-form"
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
