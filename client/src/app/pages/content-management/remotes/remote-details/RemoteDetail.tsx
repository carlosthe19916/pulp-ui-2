import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  PageSection,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DescriptorDetailFields } from "@app/components/DescriptorDetailFields";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useNotifications } from "@app/context/useNotifications";
import { getDescriptor } from "@app/descriptors/registry";
import {
  useFileRemoteDeleteMutation,
  useFileRemoteDetailQuery,
} from "@app/queries/file-remotes";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import { EditRemoteModal } from "./components/EditRemoteModal";

interface IRemoteDetailProps {
  remoteId: string;
}

export const RemoteDetail: React.FC<IRemoteDetailProps> = ({ remoteId }) => {
  const navigate = useNavigate();
  const { data: remote, isLoading, error } = useFileRemoteDetailQuery(remoteId);
  const deleteMutation = useFileRemoteDeleteMutation();
  const { addNotification } = useNotifications();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const descriptor = getDescriptor("remote", "file.file");

  const handleDelete = async () => {
    if (!remote?.pulp_href) return;
    try {
      const result = await deleteMutation.mutateAsync(remote.pulp_href);
      if (result?.task) {
        notifyTaskStarted(
          addNotification,
          result.task,
          `Remote "${remote.name}" deletion started`,
        );
      } else {
        addNotification({
          title: `Remote "${remote.name}" deleted`,
          variant: "success",
        });
      }
      void navigate({ to: "/content-management/remotes" });
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
            <PageHeader
              title={remote.name}
              breadcrumbs={
                <Breadcrumb>
                  <BreadcrumbItem>
                    <Link to="/content-management/remotes">Remotes</Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem isActive>{remote.name}</BreadcrumbItem>
                </Breadcrumb>
              }
              actionMenu={
                <PageHeaderActionsMenu
                  actions={[
                    {
                      key: "edit",
                      dropdownItemProps: {
                        children: "Edit",
                        onClick: () => setIsEditOpen(true),
                      },
                    },
                    {
                      key: "delete",
                      dropdownItemProps: {
                        children: "Delete",
                        isDanger: true,
                        onClick: () => setIsDeleteOpen(true),
                      },
                    },
                  ]}
                />
              }
            />

            <PageSection>
              <Stack hasGutter>
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
                        {formatDateTime(remote.pulp_created) ?? "—"}
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

            <ConfirmActionModal
              isOpen={isDeleteOpen}
              title="Delete Remote"
              body={`Are you sure you want to delete remote "${remote.name}"? This action cannot be undone.`}
              isConfirming={deleteMutation.isPending}
              onConfirm={() => void handleDelete()}
              onCancel={() => setIsDeleteOpen(false)}
            />
          </>
        ) : null}
      </DetailQueryGate>
    </>
  );
};
