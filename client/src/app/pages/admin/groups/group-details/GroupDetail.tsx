import type React from "react";
import { useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Tab,
  TabContentBody,
  TabTitleText,
  Tabs,
} from "@patternfly/react-core";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { GroupModal } from "@app/components/GroupModal";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { RoleAssignmentsTab } from "@app/components/RoleAssignmentsTab";
import { useNotifications } from "@app/hooks/useNotifications";
import {
  useGroupDeleteMutation,
  useGroupUsersListQuery,
  useSuspenseGroupDetailQuery,
} from "@app/queries/groups";
import { useRoleAssignmentsListQuery } from "@app/queries/roleAssignments";
import { getMutationErrorMessage } from "@app/utils/utils";

import { GroupUsersTab } from "./components/GroupUsersTab";

interface IGroupDetailProps {
  groupHref: string;
}

export const GroupDetail: React.FC<IGroupDetailProps> = ({ groupHref }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const { data: group } = useSuspenseGroupDetailQuery({ groupHref });
  // These fetches feed only the tab-title counts, so request a single row and
  // read the paginated `count` rather than pulling a page of results.
  const { data: usersData } = useGroupUsersListQuery({
    groupHref,
    params: { limit: 1 },
  });
  const { data: rolesData } = useRoleAssignmentsListQuery({
    kind: "group",
    href: groupHref,
    params: { limit: 1 },
  });

  const deleteMutation = useGroupDeleteMutation({
    onSuccess: (_data, { name }) => {
      addNotification({ title: `Group "${name}" deleted`, variant: "success" });
      // Returned so the hook drops the deleted record once the page has left.
      return navigate({ to: "/admin/groups" });
    },
    onError: (error, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete group "${name}"`,
        }),
        variant: "danger",
      }),
  });

  const [activeTab, setActiveTab] = useState<string | number>("users");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const userCount = usersData?.count ?? 0;
  const roleCount = rolesData?.count ?? 0;

  return (
    <>
      <DocumentTitle title={`Group · ${group.name}`} />
      <PageHeader
        title={group.name}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to="/admin/groups">Groups</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{group.name}</BreadcrumbItem>
          </Breadcrumb>
        }
        actionMenu={
          <PageHeaderActionsMenu
            actions={[
              {
                key: "edit",
                dropdownItemProps: {
                  children: "Edit Group",
                  onClick: () => setIsEditOpen(true),
                },
              },
              {
                key: "delete",
                dropdownItemProps: {
                  children: "Delete Group",
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
          <Tab
            eventKey="users"
            title={<TabTitleText>Users ({userCount})</TabTitleText>}
          >
            <TabContentBody hasPadding>
              <GroupUsersTab groupHref={groupHref} />
            </TabContentBody>
          </Tab>
          <Tab
            eventKey="roles"
            title={<TabTitleText>Roles ({roleCount})</TabTitleText>}
          >
            <TabContentBody hasPadding>
              <RoleAssignmentsTab
                kind="group"
                href={groupHref}
                name={group.name}
              />
            </TabContentBody>
          </Tab>
        </Tabs>
      </PageSection>

      <GroupModal
        isOpen={isEditOpen}
        group={group}
        onClose={() => setIsEditOpen(false)}
      />

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title="Delete Group"
        body={`Are you sure you want to delete group "${group.name}"? This action cannot be undone.`}
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          // Success navigates away; on error the dialog stays open for a retry.
          deleteMutation.mutate(group)
        }
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
