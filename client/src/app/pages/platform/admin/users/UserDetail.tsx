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
import dayjs from "dayjs";

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
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Spinner,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import type { UserRoleResponse } from "@app/client";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { RENDER_DATETIME_FORMAT } from "@app/Constants";
import { useNotifications } from "@app/context/useNotifications";
import { useRolesListQuery } from "@app/queries/roles";
import {
  useUserDeleteMutation,
  useUserDetailQuery,
  useUserRoleCreateMutation,
  useUserRoleDeleteMutation,
  useUserRolesListQuery,
} from "@app/queries/users";
import { extractIdFromHref, buildUserHref } from "@app/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

import { EditUserModal } from "./EditUserModal";

const addRoleSchema = yup.object({
  role: yup.string().required("Role is required"),
});

type AddRoleFormValues = yup.InferType<typeof addRoleSchema>;

interface UserDetailProps {
  userId: string;
}

export const UserDetail: React.FC<UserDetailProps> = ({ userId }) => {
  const navigate = useNavigate();
  const userHref = buildUserHref(userId);
  const { data: user, isLoading, error } = useUserDetailQuery(userHref);
  const userDisplayName = user?.username || userId;
  const { data: rolesData, isLoading: isRolesLoading } =
    useUserRolesListQuery(userHref);
  const { data: allRolesData } = useRolesListQuery({ limit: 200 });
  const deleteMutation = useUserDeleteMutation();
  const roleCreateMutation = useUserRoleCreateMutation();
  const roleDeleteMutation = useUserRoleDeleteMutation();
  const { addNotification } = useNotifications();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [removeRoleHref, setRemoveRoleHref] = useState<string | null>(null);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddRoleFormValues>({
    resolver: yupResolver(addRoleSchema),
    defaultValues: { role: "" },
  });

  const selectedRole = watch("role");
  const roles = rolesData?.results ?? [];

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

  const roleColumns = useMemo<ColumnDef<UserRoleResponse>[]>(
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
        cell: ({ row }) => row.original.description || "—",
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
            isInline
            isDanger
            onClick={() => setRemoveRoleHref(row.original.pulp_href ?? null)}
          >
            Remove
          </Button>
        ),
      },
    ],
    [roleNameToId],
  );

  const roleTable = useReactTable({
    data: roles,
    columns: roleColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(userHref);
      addNotification({
        title: "User deleted",
        variant: "success",
      });
      void navigate({ to: "/admin/users" });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete user"),
        variant: "danger",
      });
    }
    setIsDeleteOpen(false);
  };

  const onAddRole = handleSubmit(async (values) => {
    try {
      await roleCreateMutation.mutateAsync({
        userHref,
        body: { role: values.role },
      });
      addNotification({
        title: "Role assigned",
        variant: "success",
      });
      reset();
      setIsAddRoleOpen(false);
    } catch {
      addNotification({
        title: "Failed to assign role",
        variant: "danger",
      });
    }
  });

  const handleRemoveRole = async () => {
    if (!removeRoleHref) return;
    try {
      await roleDeleteMutation.mutateAsync(removeRoleHref);
      addNotification({
        title: "Role removed",
        variant: "success",
      });
    } catch {
      addNotification({
        title: "Failed to remove role",
        variant: "danger",
      });
    }
    setRemoveRoleHref(null);
  };

  return (
    <>
      <DocumentTitle
        title={user?.username ? `User · ${user.username}` : "User"}
      />
      <DetailQueryGate
        isLoading={isLoading}
        error={error}
        hasData={!!user}
        loadingLabel="Loading user"
      >
        {user ? (
          <>
            <PageSection>
              <Breadcrumb>
                <BreadcrumbItem>
                  <Link to="/admin/users">Users</Link>
                </BreadcrumbItem>
                <BreadcrumbItem isActive>{userDisplayName}</BreadcrumbItem>
              </Breadcrumb>
            </PageSection>

            <PageSection>
              <Stack hasGutter>
                <StackItem>
                  <Content component={ContentVariants.h1}>
                    {userDisplayName}
                  </Content>
                </StackItem>

                <StackItem>
                  <Button
                    variant="primary"
                    onClick={() => setIsEditOpen(true)}
                    className={spacing.mrSm}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    Delete
                  </Button>
                </StackItem>

                <StackItem>
                  <DescriptionList isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Username</DescriptionListTerm>
                      <DescriptionListDescription>
                        {user.username || "—"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Email</DescriptionListTerm>
                      <DescriptionListDescription>
                        {user.email || "—"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>First name</DescriptionListTerm>
                      <DescriptionListDescription>
                        {user.first_name || "—"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Last name</DescriptionListTerm>
                      <DescriptionListDescription>
                        {user.last_name || "—"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Active</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Label
                          color={user.is_active ? "green" : "grey"}
                          isCompact
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </Label>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Staff</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Label
                          color={user.is_staff ? "blue" : "grey"}
                          isCompact
                        >
                          {user.is_staff ? "Yes" : "No"}
                        </Label>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Date joined</DescriptionListTerm>
                      <DescriptionListDescription>
                        {user.date_joined
                          ? dayjs(user.date_joined).format(
                              RENDER_DATETIME_FORMAT,
                            )
                          : "—"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </StackItem>

                {user.groups && user.groups.length > 0 && (
                  <StackItem>
                    <Content component={ContentVariants.h2}>Groups</Content>
                    <Content component="ul">
                      {user.groups.map((group) => {
                        const groupId = group.pulp_href
                          ? extractIdFromHref(group.pulp_href)
                          : null;
                        return (
                          <Content component="li" key={group.name}>
                            {groupId ? (
                              <Link
                                to="/admin/groups/$groupId"
                                params={{ groupId }}
                              >
                                {group.name}
                              </Link>
                            ) : (
                              group.name
                            )}
                          </Content>
                        );
                      })}
                    </Content>
                  </StackItem>
                )}

                <StackItem>
                  <Content component={ContentVariants.h2}>Roles</Content>
                  <Button
                    variant="secondary"
                    onClick={() => setIsAddRoleOpen(true)}
                    className={spacing.mbMd}
                  >
                    Add role
                  </Button>
                  {isRolesLoading ? (
                    <Spinner aria-label="Loading roles" />
                  ) : (
                    <Table aria-label="User roles table" variant="compact">
                      <Thead>
                        {roleTable.getHeaderGroups().map((headerGroup) => (
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
                        {roleTable.getRowModel().rows.map((row) => (
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
                              No roles assigned.
                            </Td>
                          </Tr>
                        )}
                      </Tbody>
                    </Table>
                  )}
                </StackItem>
              </Stack>
            </PageSection>

            <EditUserModal
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
              user={user}
            />

            <Modal
              isOpen={isDeleteOpen}
              onClose={() => setIsDeleteOpen(false)}
              variant="small"
            >
              <ModalHeader title="Delete User" />
              <ModalBody>
                Are you sure you want to delete user &quot;{userDisplayName}
                &quot;? This action cannot be undone.
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
              isOpen={isAddRoleOpen}
              onClose={() => {
                setIsAddRoleOpen(false);
                reset();
              }}
              variant="small"
            >
              <ModalHeader title="Add Role" />
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
                      value={selectedRole}
                      onChange={(value) =>
                        setValue("role", value, { shouldValidate: true })
                      }
                    />
                    {errors.role && (
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem variant="error">
                            {errors.role.message}
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
                  onClick={() => void onAddRole()}
                  isDisabled={isSubmitting || roleCreateMutation.isPending}
                  isLoading={isSubmitting || roleCreateMutation.isPending}
                >
                  Add
                </Button>
                <Button
                  variant="link"
                  onClick={() => {
                    setIsAddRoleOpen(false);
                    reset();
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
                Are you sure you want to remove this role from the user?
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
    </>
  );
};
