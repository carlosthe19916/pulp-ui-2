import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Stack,
  StackItem,
  Tab,
  TabContentBody,
  TabTitleText,
  Tabs,
  TextInput,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useNotifications } from "@app/context/useNotifications";
import {
  useGroupDeleteMutation,
  useGroupDetailQuery,
  useGroupRolesListQuery,
  useGroupUpdateMutation,
  useGroupUsersListQuery,
} from "@app/queries/groups";
import { getMutationErrorMessage } from "@app/utils/utils";

import { GroupRolesTab } from "./components/GroupRolesTab";
import { GroupUsersTab } from "./components/GroupUsersTab";

const editNameSchema = yup.object({
  name: yup.string().required("Name is required"),
});

type EditNameFormValues = yup.InferType<typeof editNameSchema>;

interface IGroupDetailProps {
  groupId: string;
}

export const GroupDetail: React.FC<IGroupDetailProps> = ({ groupId }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const { data: group, isLoading, error } = useGroupDetailQuery(groupId);
  const { data: usersData } = useGroupUsersListQuery(groupId);
  const { data: rolesData } = useGroupRolesListQuery(groupId);

  const updateMutation = useGroupUpdateMutation();
  const deleteMutation = useGroupDeleteMutation();

  const [activeTab, setActiveTab] = useState<string | number>("users");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);

  const editNameForm = useForm<EditNameFormValues>({
    resolver: yupResolver(editNameSchema),
    defaultValues: { name: "" },
  });

  const userCount = usersData?.results?.length ?? 0;
  const roleCount = rolesData?.results?.length ?? 0;

  const handleDelete = async () => {
    if (!group?.pulp_href) return;
    try {
      await deleteMutation.mutateAsync(group.pulp_href);
      addNotification({
        title: `Group "${group?.name}" deleted`,
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

  const onEditName = editNameForm.handleSubmit(async (values) => {
    if (!group?.pulp_href) return;
    try {
      const result = await updateMutation.mutateAsync({
        href: group.pulp_href,
        body: { name: values.name },
      });
      addNotification({
        title: `Group name updated for "${result.name}"`,
        variant: "success",
      });
      setIsEditNameOpen(false);
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to update group name"),
        variant: "danger",
      });
    }
  });

  return (
    <>
      <DocumentTitle title={group?.name ? `Group · ${group.name}` : "Group"} />
      <DetailQueryGate
        isLoading={isLoading}
        error={error}
        hasData={!!group}
        loadingLabel="Loading group"
      >
        {group ? (
          <>
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
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      editNameForm.reset({ name: group.name });
                      setIsEditNameOpen(true);
                    }}
                  >
                    Edit Name
                  </Button>{" "}
                  <Button
                    variant="danger"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    Delete Group
                  </Button>
                </>
              }
            />

            <PageSection>
              <Stack hasGutter>
                <StackItem>
                  <DescriptionList isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>
                        {group.name}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </StackItem>

                <StackItem>
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
                </StackItem>
              </Stack>
            </PageSection>

            <Modal
              isOpen={isEditNameOpen}
              onClose={() => setIsEditNameOpen(false)}
              variant="small"
            >
              <ModalHeader title="Edit Group Name" />
              <ModalBody>
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void onEditName();
                  }}
                >
                  <FormGroup label="Name" isRequired fieldId="edit-group-name">
                    <TextInput
                      id="edit-group-name"
                      value={editNameForm.watch("name")}
                      onChange={(_e, value) =>
                        editNameForm.setValue("name", value, {
                          shouldValidate: true,
                        })
                      }
                      isRequired
                      validated={
                        editNameForm.formState.errors.name ? "error" : "default"
                      }
                    />
                    {editNameForm.formState.errors.name && (
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem variant="error">
                            {editNameForm.formState.errors.name.message}
                          </HelperTextItem>
                        </HelperText>
                      </FormHelperText>
                    )}
                  </FormGroup>
                </Form>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="primary"
                  onClick={() => void onEditName()}
                  isDisabled={
                    editNameForm.formState.isSubmitting ||
                    updateMutation.isPending
                  }
                  isLoading={
                    editNameForm.formState.isSubmitting ||
                    updateMutation.isPending
                  }
                >
                  Save
                </Button>
                <Button variant="link" onClick={() => setIsEditNameOpen(false)}>
                  Cancel
                </Button>
              </ModalFooter>
            </Modal>

            <Modal
              isOpen={isDeleteOpen}
              onClose={() => setIsDeleteOpen(false)}
              variant="small"
            >
              <ModalHeader title="Delete Group" />
              <ModalBody>
                Are you sure you want to delete group &quot;{group.name}&quot;?
                This action cannot be undone.
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
