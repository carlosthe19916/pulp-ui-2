import type React from "react";
import { useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Tab,
  TabContentBody,
  TabTitleText,
  Tabs,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { useNotifications } from "@app/context/useNotifications";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import {
  useRemoteDeleteMutation,
  useSuspenseRemoteDetailQuery,
} from "@app/queries/remotes";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { RemoteModal } from "../remote-list/components/RemoteModal";
import { RemoteDetailsTab } from "./components/RemoteDetailsTab";
import { RemoteRepositoriesTab } from "./components/RemoteRepositoriesTab";

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

  const { data: repositoriesCount } = useRepositoriesListQuery({
    params: { remote: href, limit: 1 },
  });

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

  const [activeTab, setActiveTab] = useState<string | number>("details");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <DocumentTitle title={`Remote · ${remote.name}`} />
      <PageHeader
        title={remote.name ?? extractIdFromHref(href)}
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
        <Tabs
          activeKey={activeTab}
          onSelect={(_e, tabKey) => setActiveTab(tabKey)}
          mountOnEnter
        >
          <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>}>
            <TabContentBody hasPadding>
              <RemoteDetailsTab remote={remote} pulpType={pulpType} />
            </TabContentBody>
          </Tab>
          <Tab
            eventKey="repositories"
            title={
              <TabTitleText>
                Repositories ({repositoriesCount?.count ?? 0})
              </TabTitleText>
            }
          >
            <TabContentBody hasPadding>
              <RemoteRepositoriesTab remoteHref={href} />
            </TabContentBody>
          </Tab>
        </Tabs>
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
