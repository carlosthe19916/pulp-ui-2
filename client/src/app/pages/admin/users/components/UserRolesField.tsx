import type React from "react";
import { useMemo, useState } from "react";

import {
  Button,
  Content,
  ContentVariants,
  Label,
  LabelGroup,
  Spinner,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { useRolesListQuery } from "@app/queries/roles";
import { useUserRolesListQuery } from "@app/queries/users";

import { useUserRoleActions } from "../hooks/useUserRoleActions";

interface IUserRolesFieldProps {
  userHref: string;
}

/**
 * Inline per-user role management, embedded in the edit modal. Assign/remove
 * apply immediately (removal is reversible), so there is no separate confirm.
 */
export const UserRolesField: React.FC<IUserRolesFieldProps> = ({
  userHref,
}) => {
  const { data: rolesData, isLoading } = useUserRolesListQuery(userHref);
  const { data: allRolesData } = useRolesListQuery({ limit: 200 });
  const { addRole, removeRole, isAdding, isRemoving } = useUserRoleActions();

  const [selectedRole, setSelectedRole] = useState("");

  const assignedRoles = rolesData?.results ?? [];

  const roleOptions = useMemo(
    () =>
      (allRolesData?.results ?? []).map((role) => ({
        value: role.name,
        label: role.name,
      })),
    [allRolesData?.results],
  );

  const handleAdd = async () => {
    if (!selectedRole) return;
    try {
      await addRole(userHref, selectedRole);
      setSelectedRole("");
    } catch {
      // Notification handled in useUserRoleActions.
    }
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <Content component={ContentVariants.h3}>Roles</Content>
      </StackItem>
      <StackItem>
        <Split hasGutter>
          <SplitItem isFilled>
            <TypeaheadSelect
              id="user-role-select"
              ariaLabel="Role"
              placeholder="Select a role to assign"
              options={roleOptions}
              value={selectedRole}
              onChange={(value) => setSelectedRole(value)}
            />
          </SplitItem>
          <SplitItem>
            <Button
              variant="secondary"
              onClick={() => void handleAdd()}
              isDisabled={!selectedRole || isAdding}
              isLoading={isAdding}
            >
              Add
            </Button>
          </SplitItem>
        </Split>
      </StackItem>
      <StackItem>
        {isLoading ? (
          <Spinner size="md" aria-label="Loading roles" />
        ) : assignedRoles.length === 0 ? (
          <Content component={ContentVariants.small}>
            No roles assigned.
          </Content>
        ) : (
          <LabelGroup numLabels={20}>
            {assignedRoles.map((userRole) => (
              <Label
                key={userRole.pulp_href ?? userRole.role}
                color="blue"
                onClose={
                  userRole.pulp_href
                    ? () => void removeRole(userRole.pulp_href as string)
                    : undefined
                }
                closeBtnProps={{ isDisabled: isRemoving }}
              >
                {userRole.role}
              </Label>
            ))}
          </LabelGroup>
        )}
      </StackItem>
    </Stack>
  );
};
