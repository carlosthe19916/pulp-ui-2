import type React from "react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

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
import { ActionsColumn } from "@patternfly/react-table";
import {
  DataView,
  DataViewTable,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { GroupRoleResponse, GroupUserResponse } from "@app/client";
import { dataViewBodyStates } from "@app/components/DataView";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { useNotifications } from "@app/context/useNotifications";
import { useApiDomain } from "@app/hooks/useApiDomain";
import {
  useGroupDeleteMutation,
  useGroupDetailQuery,
  useGroupRoleCreateMutation,
  useGroupRoleDeleteMutation,
  useGroupRolesListQuery,
  useGroupUpdateMutation,
  useGroupUserCreateMutation,
  useGroupUserDeleteMutation,
  useGroupUsersListQuery,
} from "@app/queries/groups";
import { useRolesListQuery } from "@app/queries/roles";
import { useUsersListQuery } from "@app/queries/users";
import { buildGroupHref, extractIdFromHref } from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

const editNameSchema = yup.object({
  name: yup.string().required("Name is required"),
});

const addUserSchema = yup.object({
  username: yup.string().required("User is required"),
});

const addRoleSchema = yup.object({
  role: yup.string().required("Role is required"),
  content_object: yup.string(),
});

type EditNameFormValues = yup.InferType<typeof editNameSchema>;
type AddUserFormValues = yup.InferType<typeof addUserSchema>;
type AddRoleFormValues = yup.InferType<typeof addRoleSchema>;

interface IGroupDetailProps {
  groupId: string;
}

export const GroupDetail: React.FC<IGroupDetailProps> = ({ groupId }) => {
  const navigate = useNavigate();
  const domain = useApiDomain();
  const groupHref = buildGroupHref(groupId, domain);
  const { addNotification } = useNotifications();

  const { data: group, isLoading, error } = useGroupDetailQuery(groupHref);
  const { data: usersData } = useGroupUsersListQuery(groupHref);
  const { data: rolesData } = useGroupRolesListQuery(groupHref);
  const { data: allUsersData } = useUsersListQuery({ limit: 200 });
  const { data: allRolesData } = useRolesListQuery({ limit: 200 });

  const updateMutation = useGroupUpdateMutation();
  const deleteMutation = useGroupDeleteMutation();
  const userCreateMutation = useGroupUserCreateMutation();
  const userDeleteMutation = useGroupUserDeleteMutation();
  const roleCreateMutation = useGroupRoleCreateMutation();
  const roleDeleteMutation = useGroupRoleDeleteMutation();

  const [activeTab, setActiveTab] = useState<string | number>("users");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [removeUserTarget, setRemoveUserTarget] =
    useState<GroupUserResponse | null>(null);
  const [removeRoleTarget, setRemoveRoleTarget] =
    useState<GroupRoleResponse | null>(null);

  const editNameForm = useForm<EditNameFormValues>({
    resolver: yupResolver(editNameSchema),
    defaultValues: { name: "" },
  });
  const addUserForm = useForm<AddUserFormValues>({
    resolver: yupResolver(addUserSchema),
    defaultValues: { username: "" },
  });
  const addRoleForm = useForm<AddRoleFormValues>({
    resolver: yupResolver(addRoleSchema),
    defaultValues: { role: "", content_object: "" },
  });

  const users = usersData?.results ?? [];
  const roles = rolesData?.results ?? [];

  const userOptions = useMemo(
    () =>
      (allUsersData?.results ?? []).map((user) => ({
        value: user.username,
        label: user.username,
      })),
    [allUsersData?.results],
  );

  const roleOptions = useMemo(
    () =>
      (allRolesData?.results ?? []).map((role) => ({
        value: role.name,
        label: role.name,
      })),
    [allRolesData?.results],
  );

  const roleNameToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const role of allRolesData?.results ?? []) {
      if (role.pulp_href) {
        map.set(role.name, extractIdFromHref(role.pulp_href));
      }
    }
    return map;
  }, [allRolesData?.results]);

  const userColumns = [
    "Username",
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const userRows: DataViewTr[] = users.map((user) => ({
    id: user.pulp_href,
    row: [
      { cell: user.username, props: { dataLabel: "Username" } },
      {
        cell: (
          <ActionsColumn
            items={[
              {
                title: "Remove",
                isDanger: true,
                onClick: () => setRemoveUserTarget(user),
              },
            ]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));

  const roleColumns = [
    "Role",
    "Description",
    "Permissions",
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const roleRows: DataViewTr[] = roles.map((role) => {
    const roleId = roleNameToId.get(role.role);
    return {
      id: role.pulp_href,
      row: [
        {
          cell: roleId ? (
            <Link to="/admin/roles/$roleId" params={{ roleId }}>
              {role.role}
            </Link>
          ) : (
            role.role
          ),
          props: { dataLabel: "Role" },
        },
        {
          cell: role.description ?? "—",
          props: { dataLabel: "Description" },
        },
        {
          cell: role.permissions?.length ?? 0,
          props: { dataLabel: "Permissions" },
        },
        {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: "Remove",
                  isDanger: true,
                  onClick: () => setRemoveRoleTarget(role),
                },
              ]}
            />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(groupHref);
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
    try {
      const result = await updateMutation.mutateAsync({
        href: groupHref,
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

  const onAddUser = addUserForm.handleSubmit(async (values) => {
    try {
      await userCreateMutation.mutateAsync({
        groupHref,
        body: { username: values.username },
      });
      addNotification({
        title: `User "${values.username}" added to group "${group?.name}"`,
        variant: "success",
      });
      addUserForm.reset();
      setIsAddUserOpen(false);
    } catch {
      addNotification({
        title: "Failed to add user to group",
        variant: "danger",
      });
    }
  });

  const handleRemoveUser = async () => {
    if (!removeUserTarget?.pulp_href) return;
    try {
      await userDeleteMutation.mutateAsync(removeUserTarget.pulp_href);
      addNotification({
        title: `User "${removeUserTarget.username}" removed from group "${group?.name}"`,
        variant: "success",
      });
    } catch {
      addNotification({
        title: "Failed to remove user from group",
        variant: "danger",
      });
    }
    setRemoveUserTarget(null);
  };

  const onAddRole = addRoleForm.handleSubmit(async (values) => {
    try {
      await roleCreateMutation.mutateAsync({
        groupHref,
        body: {
          role: values.role,
          content_object: values.content_object || null,
        },
      });
      addNotification({
        title: `Role "${values.role}" assigned to group "${group?.name}"`,
        variant: "success",
      });
      addRoleForm.reset();
      setIsAddRoleOpen(false);
    } catch {
      addNotification({
        title: "Failed to assign role to group",
        variant: "danger",
      });
    }
  });

  const handleRemoveRole = async () => {
    if (!removeRoleTarget?.pulp_href) return;
    try {
      await roleDeleteMutation.mutateAsync(removeRoleTarget.pulp_href);
      addNotification({
        title: `Role "${removeRoleTarget.role}" removed from group "${group?.name}"`,
        variant: "success",
      });
    } catch {
      addNotification({
        title: "Failed to remove role from group",
        variant: "danger",
      });
    }
    setRemoveRoleTarget(null);
  };

  const groupUsersStates = dataViewBodyStates({
    empty: users.length === 0,
    emptyState: "No users in this group.",
  });
  const groupRolesStates = dataViewBodyStates({
    empty: roles.length === 0,
    emptyState: "No roles assigned to this group.",
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
            <PageSection>
              <Breadcrumb>
                <BreadcrumbItem>
                  <Link to="/admin/groups">Groups</Link>
                </BreadcrumbItem>
                <BreadcrumbItem isActive>{group.name}</BreadcrumbItem>
              </Breadcrumb>
            </PageSection>

            <PageSection>
              <Stack hasGutter>
                <StackItem>
                  <Content component={ContentVariants.h1}>{group.name}</Content>
                </StackItem>

                <StackItem>
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
                </StackItem>

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
                      title={
                        <TabTitleText>Users ({users.length})</TabTitleText>
                      }
                    >
                      <TabContentBody hasPadding>
                        <Stack hasGutter>
                          <StackItem>
                            <Button
                              variant="primary"
                              onClick={() => setIsAddUserOpen(true)}
                            >
                              Add User
                            </Button>
                          </StackItem>
                          <StackItem>
                            <DataView
                              activeState={groupUsersStates.activeState}
                            >
                              <DataViewTable
                                aria-label="Group users table"
                                columns={userColumns}
                                rows={userRows}
                                bodyStates={groupUsersStates.bodyStates}
                              />
                            </DataView>
                          </StackItem>
                        </Stack>
                      </TabContentBody>
                    </Tab>
                    <Tab
                      eventKey="roles"
                      title={
                        <TabTitleText>Roles ({roles.length})</TabTitleText>
                      }
                    >
                      <TabContentBody hasPadding>
                        <Stack hasGutter>
                          <StackItem>
                            <Button
                              variant="primary"
                              onClick={() => setIsAddRoleOpen(true)}
                            >
                              Add Role
                            </Button>
                          </StackItem>
                          <StackItem>
                            <DataView
                              activeState={groupRolesStates.activeState}
                            >
                              <DataViewTable
                                aria-label="Group roles table"
                                columns={roleColumns}
                                rows={roleRows}
                                bodyStates={groupRolesStates.bodyStates}
                              />
                            </DataView>
                          </StackItem>
                        </Stack>
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

            <Modal
              isOpen={isAddUserOpen}
              onClose={() => {
                addUserForm.reset();
                setIsAddUserOpen(false);
              }}
              variant="small"
            >
              <ModalHeader title="Add User to Group" />
              <ModalBody>
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void onAddUser();
                  }}
                >
                  <FormGroup
                    label="User"
                    isRequired
                    fieldId="add-user-username"
                  >
                    <TypeaheadSelect
                      id="add-user-username"
                      ariaLabel="User"
                      placeholder="Select a user"
                      options={userOptions}
                      value={addUserForm.watch("username")}
                      onChange={(value) =>
                        addUserForm.setValue("username", value, {
                          shouldValidate: true,
                        })
                      }
                    />
                    {addUserForm.formState.errors.username && (
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem variant="error">
                            {addUserForm.formState.errors.username.message}
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
                  onClick={() => void onAddUser()}
                  isDisabled={
                    addUserForm.formState.isSubmitting ||
                    userCreateMutation.isPending
                  }
                  isLoading={
                    addUserForm.formState.isSubmitting ||
                    userCreateMutation.isPending
                  }
                >
                  Add
                </Button>
                <Button
                  variant="link"
                  onClick={() => {
                    addUserForm.reset();
                    setIsAddUserOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </ModalFooter>
            </Modal>

            <Modal
              isOpen={!!removeUserTarget}
              onClose={() => setRemoveUserTarget(null)}
              variant="small"
            >
              <ModalHeader title="Remove User" />
              <ModalBody>
                Are you sure you want to remove user &quot;
                {removeUserTarget?.username}&quot; from the group?
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="danger"
                  onClick={() => void handleRemoveUser()}
                  isLoading={userDeleteMutation.isPending}
                >
                  Remove
                </Button>
                <Button
                  variant="link"
                  onClick={() => setRemoveUserTarget(null)}
                >
                  Cancel
                </Button>
              </ModalFooter>
            </Modal>

            <Modal
              isOpen={isAddRoleOpen}
              onClose={() => {
                addRoleForm.reset();
                setIsAddRoleOpen(false);
              }}
              variant="small"
            >
              <ModalHeader title="Assign Role to Group" />
              <ModalBody>
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void onAddRole();
                  }}
                >
                  <FormGroup label="Role" isRequired fieldId="add-role-name">
                    <TypeaheadSelect
                      id="add-role-name"
                      ariaLabel="Role"
                      placeholder="Select a role"
                      options={roleOptions}
                      value={addRoleForm.watch("role")}
                      onChange={(value) =>
                        addRoleForm.setValue("role", value, {
                          shouldValidate: true,
                        })
                      }
                    />
                    {addRoleForm.formState.errors.role && (
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem variant="error">
                            {addRoleForm.formState.errors.role.message}
                          </HelperTextItem>
                        </HelperText>
                      </FormHelperText>
                    )}
                  </FormGroup>
                  <FormGroup
                    label="Content Object"
                    fieldId="add-role-content-object"
                  >
                    <TextInput
                      id="add-role-content-object"
                      value={addRoleForm.watch("content_object")}
                      onChange={(_e, value) =>
                        addRoleForm.setValue("content_object", value)
                      }
                      placeholder="Optional pulp_href"
                    />
                  </FormGroup>
                </Form>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="primary"
                  onClick={() => void onAddRole()}
                  isDisabled={
                    addRoleForm.formState.isSubmitting ||
                    roleCreateMutation.isPending
                  }
                  isLoading={
                    addRoleForm.formState.isSubmitting ||
                    roleCreateMutation.isPending
                  }
                >
                  Assign
                </Button>
                <Button
                  variant="link"
                  onClick={() => {
                    addRoleForm.reset();
                    setIsAddRoleOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </ModalFooter>
            </Modal>

            <Modal
              isOpen={!!removeRoleTarget}
              onClose={() => setRemoveRoleTarget(null)}
              variant="small"
            >
              <ModalHeader title="Remove Role" />
              <ModalBody>
                Are you sure you want to remove role &quot;
                {removeRoleTarget?.role}&quot; from the group?
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="danger"
                  onClick={() => void handleRemoveRole()}
                  isLoading={roleDeleteMutation.isPending}
                >
                  Remove
                </Button>
                <Button
                  variant="link"
                  onClick={() => setRemoveRoleTarget(null)}
                >
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
