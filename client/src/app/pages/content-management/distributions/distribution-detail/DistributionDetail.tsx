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
import { TabHelpAction } from "@app/components/TabHelpAction";
import { TaskHistoryTab } from "@app/components/TaskHistoryTab";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { defineTabState, usePersistentTab } from "@app/hooks/usePersistentTab";
import { useTaskFeedback } from "@app/hooks/useTaskFeedback";
import {
  useDistributionDeleteMutation,
  useSuspenseDistributionDetailQuery,
} from "@app/queries/distributions";
import { useTasksListQuery } from "@app/queries/tasks";
import {
  extractIdFromHref,
  hasRoleEndpoints,
} from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getEntityForm } from "@plugins";

import { DistributionDetailsView } from "./components/DistributionDetailsView";

interface IDistributionDetailProps {
  pulpDomain: string;
  pulpType: string;
  href: string;
}

const DISTRIBUTION_DETAIL_TABS = defineTabState({
  tabs: ["details", "tasks", "access"],
  defaultValue: "details",
});

export const DistributionDetail: React.FC<IDistributionDetailProps> = ({
  pulpDomain,
  pulpType,
  href,
}) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const taskFeedback = useTaskFeedback();
  const { data: distribution } = useSuspenseDistributionDetailQuery({ href });
  const { disabledProps } = useObjectPermissions({ href });
  const prn = distribution.prn ?? "";
  const name = distribution.name ?? extractIdFromHref(href);
  const hasEditForm = !!getEntityForm({
    entity: "distribution",
    pulpType,
    mode: "edit",
  });
  const canManageRoles = hasRoleEndpoints(href);

  // Tab-title count: one row, read the paginated `count`.
  const { data: tasksCount } = useTasksListQuery({
    params: { reserved_resources: prn, limit: 1 },
  });

  const deleteMutation = useDistributionDeleteMutation({
    onSuccess: (data, { name: deletedName }) =>
      taskFeedback.reportWrite({
        result: data,
        finishedTitle: `Distribution "${deletedName}" deleted`,
        startedTitle: `Distribution "${deletedName}" deletion started`,
      }),

    onError: (error, { name: deletedName }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete distribution "${deletedName}"`,
        }),
        variant: "danger",
      }),
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { tab: activeTab, selectTab } = usePersistentTab({
    ...DISTRIBUTION_DETAIL_TABS,
    storage: "url",
    available: [
      "details",
      "tasks",
      ...(canManageRoles ? (["access"] as const) : []),
    ],
  });

  return (
    <>
      <DocumentTitle title={`Distribution · ${name}`} />
      <PageHeader
        title={name}
        label={<Label color="blue">plugin: {pulpType}</Label>}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link
                to="/content-management/$pulpDomain/distributions"
                params={{ pulpDomain }}
              >
                Distributions
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{name}</BreadcrumbItem>
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
                      to: "/content-management/$pulpDomain/distributions/$distributionType/$distributionId/edit",
                      params: {
                        pulpDomain,
                        distributionType: pulpType,
                        distributionId: extractIdFromHref(href),
                      },
                    }),
                  ...(hasEditForm
                    ? disabledProps("change")
                    : {
                        isAriaDisabled: true,
                        tooltipProps: {
                          content:
                            "This distribution's plugin type isn't available in the UI.",
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
          onSelect={(_event, tabKey) => selectTab(tabKey)}
          mountOnEnter
        >
          <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>}>
            <TabContentBody hasPadding>
              <DistributionDetailsView
                distribution={distribution}
                pulpType={pulpType}
              />
            </TabContentBody>
          </Tab>
          <Tab
            eventKey="tasks"
            title={
              <TabTitleText>Tasks ({tasksCount?.count ?? 0})</TabTitleText>
            }
            actions={
              <TabHelpAction
                tabName="Tasks"
                headerContent="Task history"
                bodyContent="Tasks that changed this distribution: edits and deletion. Tasks in every state are listed. The task that created the distribution isn't included."
              />
            }
          >
            <TabContentBody hasPadding>
              <TaskHistoryTab prn={prn} />
            </TabContentBody>
          </Tab>
          {canManageRoles && (
            <Tab eventKey="access" title={<TabTitleText>Access</TabTitleText>}>
              <TabContentBody hasPadding>
                <ObjectAccessPanel href={href} name={distribution.name} />
              </TabContentBody>
            </Tab>
          )}
        </Tabs>
      </PageSection>

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title="Delete Distribution"
        body={`Are you sure you want to delete distribution "${name}"? This action cannot be undone.`}
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          // Leaving is call-level: skipped if the user already left while it ran.
          deleteMutation.mutate(distribution, {
            onSuccess: () =>
              void navigate({
                to: "/content-management/$pulpDomain/distributions",
                params: { pulpDomain },
              }),
          })
        }
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
