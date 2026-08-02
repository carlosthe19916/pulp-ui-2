import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";

import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { DescriptorDetailFields } from "@app/components/DescriptorDetailFields";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { RENDER_DATETIME_FORMAT } from "@app/Constants";
import { useNotifications } from "@app/context/useNotifications";
import { getDescriptor } from "@app/descriptors/registry";
import {
  useFileRemoteDeleteMutation,
  useFileRemoteDetailQuery,
} from "@app/queries/file-remotes";
import { buildRemoteHref } from "@app/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { EditRemoteModal } from "./EditRemoteModal";

interface RemoteDetailProps {
  remoteId: string;
}

export const RemoteDetail: React.FC<RemoteDetailProps> = ({ remoteId }) => {
  const navigate = useNavigate();
  const remoteHref = buildRemoteHref(remoteId);
  const {
    data: remote,
    isLoading,
    error,
  } = useFileRemoteDetailQuery(remoteHref);
  const deleteMutation = useFileRemoteDeleteMutation();
  const { addNotification } = useNotifications();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const descriptor = getDescriptor("remote", "file.file");

  const handleDelete = async () => {
    try {
      const result = await deleteMutation.mutateAsync(remoteHref);
      if (result?.task) {
        notifyTaskStarted(
          addNotification,
          result.task,
          "Remote deletion started",
        );
      } else {
        addNotification({
          title: "Remote deleted",
          variant: "success",
        });
      }
      void navigate({ to: "/remotes" });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete remote"),
        variant: "danger",
      });
    }
    setIsDeleteOpen(false);
  };

  return (
    <>
      <DocumentTitle title={remote?.name ?? "Remote"} />
      <DetailQueryGate
        isLoading={isLoading}
        error={error}
        hasData={!!remote}
        loadingLabel="Loading remote"
      >
        {remote ? (
          <>
            <PageSection>
              <Breadcrumb>
                <BreadcrumbItem>
                  <Link to="/remotes">Remotes</Link>
                </BreadcrumbItem>
                <BreadcrumbItem isActive>{remote.name}</BreadcrumbItem>
              </Breadcrumb>
            </PageSection>

            <PageSection>
              <Stack hasGutter>
                <StackItem>
                  <Content component={ContentVariants.h1}>
                    {remote.name}
                  </Content>
                </StackItem>

                <StackItem>
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditOpen(true)}
                    className={spacing.mrSm}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    Delete
                  </Button>
                </StackItem>

                <StackItem>
                  <DescriptionList isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>
                        {remote.name}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Created</DescriptionListTerm>
                      <DescriptionListDescription>
                        {remote.pulp_created
                          ? dayjs(remote.pulp_created).format(
                              RENDER_DATETIME_FORMAT,
                            )
                          : "—"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptorDetailFields
                      fields={descriptor?.detailFields}
                      entity={remote}
                    />
                  </DescriptionList>
                </StackItem>
              </Stack>
            </PageSection>

            <EditRemoteModal
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
              remote={remote}
            />

            <Modal
              isOpen={isDeleteOpen}
              onClose={() => setIsDeleteOpen(false)}
              variant="small"
            >
              <ModalHeader title="Delete Remote" />
              <ModalBody>
                Are you sure you want to delete remote &quot;{remote.name}
                &quot;? This action cannot be undone.
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="danger"
                  onClick={() => void handleDelete()}
                  isLoading={deleteMutation.isPending}
                >
                  Delete
                </Button>
                <Button variant="link" onClick={() => setIsDeleteOpen(false)}>
                  Cancel
                </Button>
              </ModalFooter>
            </Modal>
          </>
        ) : null}
      </DetailQueryGate>
    </>
  );
};
