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
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useNotifications } from "@app/context/useNotifications";
import {
  useGroupDeleteMutation,
  useGroupRolesListQuery,
  useGroupUsersListQuery,
  useSuspenseGroupDetailQuery,
} from "@app/queries/groups";
import { getMutationErrorMessage } from "@app/utils/utils";

import { GroupModal } from "../components/GroupModal";
import { GroupRolesTab } from "./components/GroupRolesTab";
import { GroupUsersTab } from "./components/GroupUsersTab";

interface IGroupDetailProps {
  groupId: string;
}

export const GroupDetail: React.FC<IGroupDetailProps> = ({ groupId }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const { data: group } = useSuspenseGroupDetailQuery(groupId);
  const { data: usersData } = useGroupUsersListQuery(groupId);
  const { data: rolesData } = useGroupRolesListQuery(groupId);

  const deleteMutation = useGroupDeleteMutation();

  const [activeTab, setActiveTab] = useState<string | number>("users");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);

  const userCount = usersData?.results?.length ?? 0;
  const roleCount = rolesData?.results?.length ?? 0;

  const handleDelete = async () => {
    if (!group.pulp_href) return;
    try {
      await deleteMutation.mutateAsync(group.pulp_href);
      addNotification({
        title: `Group "${group.name}" deleted`,
        variant: "success",
      });
      void navigate({ to: "/admin/groups" });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete group"),
        variant: "danger",
      });
    }
    setIsDeleteOpen(false);
  };

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
                  children: "Edit Name",
                  onClick: () => setIsEditNameOpen(true),
                },
              },
              {
                key: "delete",
                dropdownItemProps: {
                  children: "Delete Group",
                  isDanger: true,
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
        >
          <Tab
            eventKey="users"
            title={<TabTitleText>Users ({userCount})</TabTitleText>}
          >
            <TabContentBody hasPadding>
              <GroupUsersTab
                groupId={groupId}
                groupHref={group.pulp_href ?? ""}
                groupName={group.name}
              />
            </TabContentBody>
          </Tab>
          <Tab
            eventKey="roles"
            title={<TabTitleText>Roles ({roleCount})</TabTitleText>}
          >
            <TabContentBody hasPadding>
              <GroupRolesTab
                groupId={groupId}
                groupHref={group.pulp_href ?? ""}
                groupName={group.name}
              />
            </TabContentBody>
          </Tab>
        </Tabs>
      </PageSection>

      <GroupModal
        isOpen={isEditNameOpen}
        group={group}
        onClose={() => setIsEditNameOpen(false)}
      />

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title="Delete Group"
        body={`Are you sure you want to delete group "${group.name}"? This action cannot be undone.`}
        isConfirming={deleteMutation.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
