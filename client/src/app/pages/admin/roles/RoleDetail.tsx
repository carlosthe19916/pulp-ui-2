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
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useNotifications } from "@app/context/useNotifications";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { useRoleDeleteMutation, useRoleDetailQuery } from "@app/queries/roles";
import { buildRoleHref } from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

import { EditRoleModal } from "./components/EditRoleModal";

interface RoleDetailProps {
  roleId: string;
}

export const RoleDetail: React.FC<RoleDetailProps> = ({ roleId }) => {
  const navigate = useNavigate();
  const domain = useApiDomain();
  const roleHref = buildRoleHref(roleId, domain);
  const { data: role, isLoading, error } = useRoleDetailQuery(roleHref);
  const deleteMutation = useRoleDeleteMutation();
  const { addNotification } = useNotifications();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(roleHref);
      addNotification({
        title: `Role "${role?.name}" deleted`,
        variant: "success",
      });
      void navigate({ to: "/admin/roles" });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete role"),
        variant: "danger",
      });
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
            <PageSection>
              <Breadcrumb>
                <BreadcrumbItem>
                  <Link to="/admin/roles">Roles</Link>
                </BreadcrumbItem>
                <BreadcrumbItem isActive>{role.name}</BreadcrumbItem>
              </Breadcrumb>
            </PageSection>

            <PageSection>
              <Stack hasGutter>
                <StackItem>
                  <Content component={ContentVariants.h1}>{role.name}</Content>
                </StackItem>

                <StackItem>
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
                </StackItem>

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

            <EditRoleModal
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
              role={role}
            />

            <Modal
              isOpen={isDeleteOpen}
              onClose={() => setIsDeleteOpen(false)}
              variant="small"
            >
              <ModalHeader title="Delete Role" />
              <ModalBody>
                Are you sure you want to delete the role &quot;{role.name}
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
          </>
        ) : null}
      </DetailQueryGate>
    </>
  );
};
