import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  LabelGroup,
  PageSection,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useSuspenseRoleDetailQuery } from "@app/queries/roles";

import { RoleModal } from "../components/RoleModal";
import { useRoleActions } from "../hooks/useRoleActions";

interface IRoleDetailProps {
  roleId: string;
}

export const RoleDetail: React.FC<IRoleDetailProps> = ({ roleId }) => {
  const navigate = useNavigate();
  const { data: role } = useSuspenseRoleDetailQuery(roleId);
  const { deleteRole, isDeleting } = useRoleActions();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteRole(roleId, role.name ?? "");
      void navigate({ to: "/admin/roles" });
    } catch {
      // Notifications are handled in useRoleActions.
    }
    setIsDeleteOpen(false);
  };

  return (
    <>
      <DocumentTitle title={`Role · ${role.name}`} />
      <PageHeader
        title={role.name}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to="/admin/roles">Roles</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{role.name}</BreadcrumbItem>
          </Breadcrumb>
        }
        actionMenu={
          <PageHeaderActionsMenu
            actions={[
              {
                key: "edit",
                dropdownItemProps: {
                  children: "Edit",
                  isDisabled: role.locked,
                  onClick: () => setIsEditOpen(true),
                },
              },
              {
                key: "delete",
                dropdownItemProps: {
                  children: "Delete",
                  isDanger: true,
                  isDisabled: role.locked,
                  onClick: () => setIsDeleteOpen(true),
                },
              },
            ]}
          />
        }
      />

      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription>
                  {role.name}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Description</DescriptionListTerm>
                <DescriptionListDescription>
                  {role.description || "—"}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Locked</DescriptionListTerm>
                <DescriptionListDescription>
                  {role.locked ? (
                    <Label color="green" isCompact>
                      Yes
                    </Label>
                  ) : (
                    <Label color="grey" isCompact>
                      No
                    </Label>
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </StackItem>

          <StackItem>
            <Content component={ContentVariants.h2}>Permissions</Content>
            {(role.permissions ?? []).length > 0 ? (
              <LabelGroup>
                {(role.permissions ?? []).map((perm) => (
                  <Label key={perm} isCompact>
                    {perm}
                  </Label>
                ))}
              </LabelGroup>
            ) : (
              <Content component={ContentVariants.p}>
                No permissions assigned.
              </Content>
            )}
          </StackItem>
        </Stack>
      </PageSection>

      <RoleModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        role={role}
      />

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title="Delete Role"
        body={`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
