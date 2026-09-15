import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

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
  Label,
  LabelGroup,
  PageSection,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { useRoleDetailQuery } from "@app/queries/roles";
import { buildRoleHref } from "@app/queries/utils/pulpHref";

import { RoleEditModal } from "./components/RoleModal";
import { useRoleActions } from "./hooks/useRoleActions";

interface IRoleDetailProps {
  roleId: string;
}

export const RoleDetail: React.FC<IRoleDetailProps> = ({ roleId }) => {
  const navigate = useNavigate();
  const domain = useApiDomain();
  const roleHref = buildRoleHref(roleId, domain);
  const { data: role, isLoading, error } = useRoleDetailQuery(roleHref);
  const { deleteRole, isDeleting } = useRoleActions();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteRole(roleHref, role?.name ?? "");
      void navigate({ to: "/admin/roles" });
    } catch {
      // Notifications are handled in useRoleActions.
    }
    setIsDeleteOpen(false);
  };

  return (
    <>
      <DocumentTitle title={role?.name ? `Role · ${role.name}` : "Role"} />
      <DetailQueryGate
        isLoading={isLoading}
        error={error}
        hasData={!!role}
        loadingLabel="Loading role"
      >
        {role ? (
          <>
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
                <>
                  <Button
                    variant="primary"
                    onClick={() => setIsEditOpen(true)}
                    isDisabled={role.locked}
                  >
                    Edit
                  </Button>{" "}
                  <Button
                    variant="danger"
                    onClick={() => setIsDeleteOpen(true)}
                    isDisabled={role.locked}
                  >
                    Delete
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

            <RoleEditModal
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
        ) : null}
      </DetailQueryGate>
    </>
  );
};
