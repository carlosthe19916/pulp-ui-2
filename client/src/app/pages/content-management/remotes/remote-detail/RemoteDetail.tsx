import type React from "react";
import { useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  Label,
  PageSection,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { useNotifications } from "@app/hooks/useNotifications";
import {
  useRemoteDeleteMutation,
  useSuspenseRemoteDetailQuery,
} from "@app/queries/remotes";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { RemoteModal } from "../remote-list/components/RemoteModal";
import { RemoteDetailsView } from "./components/RemoteDetailsView";

interface IRemoteDetailProps {
  pulpDomain: string;
  pulpType: string;
  id: string;
}

export const RemoteDetail: React.FC<IRemoteDetailProps> = ({
  pulpDomain,
  pulpType,
  id,
}) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const { data: remote } = useSuspenseRemoteDetailQuery({ pulpType, id });
  const href = remote.pulp_href ?? "";

  const deleteMutation = useRemoteDeleteMutation({
    onSuccess: (data, { name }) => {
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: `Remote "${name}" deletion started`,
      });
      void navigate({
        to: "/content-management/$pulpDomain/remotes",
        params: { pulpDomain },
      });
    },
    onError: (error, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete remote "${name}"`,
        }),
        variant: "danger",
      }),
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <DocumentTitle title={`Remote · ${remote.name}`} />
      <PageHeader
        title={remote.name ?? extractIdFromHref(href)}
        label={<Label color="blue">plugin: {pulpType}</Label>}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link
                to="/content-management/$pulpDomain/remotes"
                params={{ pulpDomain }}
              >
                Remotes
              </Link>
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
                  onClick: () => setIsDeleteOpen(true),
                },
              },
            ]}
          />
        }
      />

      <PageSection>
        <RemoteDetailsView remote={remote} pulpType={pulpType} />
      </PageSection>

      <RemoteModal
        isOpen={isEditOpen}
        entity={remote}
        onClose={() => setIsEditOpen(false)}
      />

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title="Delete Remote"
        body={`Are you sure you want to delete remote "${remote.name}"? This action cannot be undone.`}
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(
            { href, name: remote.name ?? "" },
            { onSuccess: () => setIsDeleteOpen(false) },
          )
        }
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
