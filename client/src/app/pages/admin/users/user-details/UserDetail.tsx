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
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { RoleAssignmentsTab } from "@app/components/RoleAssignmentsTab";
import { UserModal } from "@app/components/UserModal";
import { useNotifications } from "@app/hooks/useNotifications";
import { useRoleAssignmentsListQuery } from "@app/queries/roleAssignments";
import {
  useSuspenseUserDetailQuery,
  useUserDeleteMutation,
} from "@app/queries/users";
import { getMutationErrorMessage } from "@app/utils/utils";

import { UserGroupsTab } from "./components/UserGroupsTab";

interface IUserDetailProps {
  userHref: string;
}

export const UserDetail: React.FC<IUserDetailProps> = ({ userHref }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const { data: user } = useSuspenseUserDetailQuery({ href: userHref });
  // Feeds only the tab-title count, so request a single row and read `count`.
  const { data: rolesData } = useRoleAssignmentsListQuery({
    kind: "user",
    href: userHref,
    params: { limit: 1 },
  });

  const deleteMutation = useUserDeleteMutation({
    onSuccess: (_data, { username }) => {
      addNotification({
        title: `User "${username}" deleted`,
        variant: "success",
      });
      // Returned so the hook drops the deleted record once the page has left.
      return navigate({ to: "/admin/users" });
    },
    onError: (error, { username }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete user "${username}"`,
        }),
        variant: "danger",
      }),
  });

  const [activeTab, setActiveTab] = useState<string | number>("groups");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const groupCount = user.groups?.length ?? 0;
  const roleCount = rolesData?.count ?? 0;

  return (
    <>
      <DocumentTitle title={`User · ${user.username}`} />
      <PageHeader
        title={user.username}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to="/admin/users">Users</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{user.username}</BreadcrumbItem>
          </Breadcrumb>
        }
        actionMenu={
          <PageHeaderActionsMenu
            actions={[
              {
                key: "edit",
                dropdownItemProps: {
                  children: "Edit User",
                  onClick: () => setIsEditOpen(true),
                },
              },
              {
                key: "delete",
                dropdownItemProps: {
                  children: "Delete User",
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
            eventKey="groups"
            title={<TabTitleText>Groups ({groupCount})</TabTitleText>}
          >
            <TabContentBody hasPadding>
              <UserGroupsTab userHref={userHref} />
            </TabContentBody>
          </Tab>
          <Tab
            eventKey="roles"
            title={<TabTitleText>Roles ({roleCount})</TabTitleText>}
          >
            <TabContentBody hasPadding>
              <RoleAssignmentsTab
                kind="user"
                href={userHref}
                name={user.username}
              />
            </TabContentBody>
          </Tab>
        </Tabs>
      </PageSection>

      <UserModal
        isOpen={isEditOpen}
        user={user}
        onClose={() => setIsEditOpen(false)}
      />

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title="Delete User"
        body={`Are you sure you want to delete "${user.username}"? This action cannot be undone.`}
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          // Success navigates away; on error the dialog stays open for a retry.
          deleteMutation.mutate(user)
        }
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
