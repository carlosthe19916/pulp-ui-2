import type React from "react";
import { useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  Label,
  PageSection,
  Tab,
  TabContentBody,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { ObjectAccessPanel } from "@app/components/ObjectAccessPanel";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { getEntityForm } from "@app/forms";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import {
  useRemoteDeleteMutation,
  useSuspenseRemoteDetailQuery,
} from "@app/queries/remotes";
import { useTasksListQuery } from "@app/queries/tasks";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { RemoteDetailsView } from "./components/RemoteDetailsView";
import { RemoteTasksTab } from "./components/RemoteTasksTab";

interface IRemoteDetailProps {
  pulpDomain: string;
  pulpType: string;
  href: string;
}

export const RemoteDetail: React.FC<IRemoteDetailProps> = ({
  pulpDomain,
  pulpType,
  href,
}) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const { data: remote } = useSuspenseRemoteDetailQuery({ href });
  const { disabledProps } = useObjectPermissions({ href });
  const prn = remote.prn ?? "";

  // Tab-title count: one row, read the paginated `count`.
  const { data: tasksCount } = useTasksListQuery({
    params: { reserved_resources: prn, limit: 1 },
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

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const hasEditForm = !!getEntityForm({
    entity: "remote",
    pulpType,
    mode: "edit",
  });
  const [activeTab, setActiveTab] = useState<string | number>("details");

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
                  onClick: () =>
                    void navigate({
                      to: "/content-management/$pulpDomain/remotes/$remoteType/$remoteId/edit",
                      params: {
                        pulpDomain,
                        remoteType: pulpType,
                        remoteId: extractIdFromHref(href),
                      },
                    }),
                  ...(hasEditForm
                    ? disabledProps("change")
                    : {
                        isAriaDisabled: true,
                        tooltipProps: {
                          content:
                            "This remote's plugin type isn't available in the UI.",
                        },
                      }),
                },
              },
              {
                key: "delete",
                dropdownItemProps: {
                  children: "Delete",
                  onClick: () => setIsDeleteOpen(true),
                  ...disabledProps("delete"),
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
              <RemoteDetailsView remote={remote} pulpType={pulpType} />
            </TabContentBody>
          </Tab>
          <Tab
            eventKey="tasks"
            title={
              <TabTitleText>Tasks ({tasksCount?.count ?? 0})</TabTitleText>
            }
          >
            <TabContentBody hasPadding>
              <RemoteTasksTab prn={prn} />
            </TabContentBody>
          </Tab>
          <Tab eventKey="access" title={<TabTitleText>Access</TabTitleText>}>
            <TabContentBody hasPadding>
              <ObjectAccessPanel href={href} name={remote.name} />
            </TabContentBody>
          </Tab>
        </Tabs>
      </PageSection>

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title="Delete Remote"
        body={`Are you sure you want to delete remote "${remote.name}"? This action cannot be undone.`}
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(remote, {
            onSuccess: () => setIsDeleteOpen(false),
          })
        }
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
