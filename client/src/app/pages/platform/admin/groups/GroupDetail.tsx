import type React from "react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

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
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import type { GroupRoleResponse, GroupUserResponse } from "@app/client";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { useNotifications } from "@app/context/useNotifications";
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
import { buildGroupHref, extractIdFromHref } from "@app/utils/pulpHref";

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

interface GroupDetailProps {
  groupId: string;
}

export const GroupDetail: React.FC<GroupDetailProps> = ({ groupId }) => {
  const navigate = useNavigate();
  const groupHref = buildGroupHref(groupId);
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
  const [removeUserHref, setRemoveUserHref] = useState<string | null>(null);
  const [removeRoleHref, setRemoveRoleHref] = useState<string | null>(null);

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

  const usernameToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of allUsersData?.results ?? []) {
      if (user.pulp_href) {
        map.set(user.username, extractIdFromHref(user.pulp_href));
      }
    }
    return map;
  }, [allUsersData?.results]);

  const roleNameToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const role of allRolesData?.results ?? []) {
      if (role.pulp_href) {
        map.set(role.name, extractIdFromHref(role.pulp_href));
      }
    }
    return map;
  }, [allRolesData?.results]);

  const userColumns = useMemo<ColumnDef<GroupUserResponse>[]>(
    () => [
      {
        id: "username",
        header: "Username",
        cell: ({ row }) => {
          const userId = usernameToId.get(row.original.username);
          return userId ? (
            <Link to="/admin/users/$userId" params={{ userId }}>
              {row.original.username}
            </Link>
          ) : (
            row.original.username
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="link"
            isDanger
            isInline
            onClick={() => setRemoveUserHref(row.original.pulp_href ?? null)}
          >
            Remove
          </Button>
        ),
      },
    ],
    [usernameToId],
  );

  const roleColumns = useMemo<ColumnDef<GroupRoleResponse>[]>(
    () => [
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => {
          const roleId = roleNameToId.get(row.original.role);
          return roleId ? (
            <Link to="/admin/roles/$roleId" params={{ roleId }}>
              {row.original.role}
            </Link>
          ) : (
            row.original.role
          );
        },
      },
      {
        id: "description",
        header: "Description",
        cell: ({ row }) => row.original.description ?? "—",
      },
      {
        id: "permissions",
        header: "Permissions",
        cell: ({ row }) => row.original.permissions?.length ?? 0,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="link"
            isDanger
            isInline
            onClick={() => setRemoveRoleHref(row.original.pulp_href ?? null)}
          >
            Remove
          </Button>
        ),
      },
    ],
    [roleNameToId],
  );

  const usersTable = useReactTable({
    data: users,
    columns: userColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const rolesTable = useReactTable({
    data: roles,
    columns: roleColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(groupHref);
      addNotification({
        title: "Group deleted",
        variant: "success",
      });
      void navigate({ to: "/admin/groups" });
    } catch {
      addNotification({
        title: "Failed to delete group",
        variant: "danger",
      });
    }
    setIsDeleteOpen(false);
  };

  const onEditName = editNameForm.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        href: groupHref,
        body: { name: values.name },
      });
      addNotification({
        title: "Group name updated",
        variant: "success",
      });
      setIsEditNameOpen(false);
    } catch {
      addNotification({
        title: "Failed to update group name",
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
        title: "User added to group",
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
    if (!removeUserHref) return;
    try {
      await userDeleteMutation.mutateAsync(removeUserHref);
      addNotification({
        title: "User removed from group",
        variant: "success",
      });
    } catch {
      addNotification({
        title: "Failed to remove user from group",
        variant: "danger",
      });
    }
    setRemoveUserHref(null);
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
        title: "Role assigned to group",
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
    if (!removeRoleHref) return;
    try {
      await roleDeleteMutation.mutateAsync(removeRoleHref);
      addNotification({
        title: "Role removed from group",
        variant: "success",
      });
    } catch {
      addNotification({
        title: "Failed to remove role from group",
        variant: "danger",
      });
    }
    setRemoveRoleHref(null);
  };

  return (
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
                <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
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
                    title={<TabTitleText>Users ({users.length})</TabTitleText>}
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
                          <Table
                            aria-label="Group users table"
                            variant="compact"
                          >
                            <Thead>
                              {usersTable
                                .getHeaderGroups()
                                .map((headerGroup) => (
                                  <Tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                      <Th key={header.id}>
                                        {header.isPlaceholder
                                          ? null
                                          : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext(),
                                            )}
                                      </Th>
                                    ))}
                                  </Tr>
                                ))}
                            </Thead>
                            <Tbody>
                              {usersTable.getRowModel().rows.map((row) => (
                                <Tr key={row.id}>
                                  {row.getVisibleCells().map((cell) => (
                                    <Td key={cell.id}>
                                      {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext(),
                                      )}
                                    </Td>
                                  ))}
                                </Tr>
                              ))}
                              {users.length === 0 && (
                                <Tr>
                                  <Td colSpan={userColumns.length}>
                                    No users in this group.
                                  </Td>
                                </Tr>
                              )}
                            </Tbody>
                          </Table>
                        </StackItem>
                      </Stack>
                    </TabContentBody>
                  </Tab>
                  <Tab
                    eventKey="roles"
                    title={<TabTitleText>Roles ({roles.length})</TabTitleText>}
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
                          <Table
                            aria-label="Group roles table"
                            variant="compact"
                          >
                            <Thead>
                              {rolesTable
                                .getHeaderGroups()
                                .map((headerGroup) => (
                                  <Tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                      <Th key={header.id}>
                                        {header.isPlaceholder
                                          ? null
                                          : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext(),
                                            )}
                                      </Th>
                                    ))}
                                  </Tr>
                                ))}
                            </Thead>
                            <Tbody>
                              {rolesTable.getRowModel().rows.map((row) => (
                                <Tr key={row.id}>
                                  {row.getVisibleCells().map((cell) => (
                                    <Td key={cell.id}>
                                      {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext(),
                                      )}
                                    </Td>
                                  ))}
                                </Tr>
                              ))}
                              {roles.length === 0 && (
                                <Tr>
                                  <Td colSpan={roleColumns.length}>
                                    No roles assigned to this group.
                                  </Td>
                                </Tr>
                              )}
                            </Tbody>
                          </Table>
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
                <FormGroup label="User" isRequired fieldId="add-user-username">
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
            isOpen={!!removeUserHref}
            onClose={() => setRemoveUserHref(null)}
            variant="small"
          >
            <ModalHeader title="Remove User" />
            <ModalBody>
              Are you sure you want to remove this user from the group?
            </ModalBody>
            <ModalFooter>
              <Button
                variant="danger"
                onClick={() => void handleRemoveUser()}
                isLoading={userDeleteMutation.isPending}
              >
                Remove
              </Button>
              <Button variant="link" onClick={() => setRemoveUserHref(null)}>
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
            isOpen={!!removeRoleHref}
            onClose={() => setRemoveRoleHref(null)}
            variant="small"
          >
            <ModalHeader title="Remove Role" />
            <ModalBody>
              Are you sure you want to remove this role from the group?
            </ModalBody>
            <ModalFooter>
              <Button
                variant="danger"
                onClick={() => void handleRemoveRole()}
                isLoading={roleDeleteMutation.isPending}
              >
                Remove
              </Button>
              <Button variant="link" onClick={() => setRemoveRoleHref(null)}>
                Cancel
              </Button>
            </ModalFooter>
          </Modal>
        </>
      ) : null}
    </DetailQueryGate>
  );
};
