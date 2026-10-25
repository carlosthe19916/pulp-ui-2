import type React from "react";
import { useState } from "react";

import {
  Button,
  Label,
  LabelGroup,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import { DataView, DataViewTable } from "@patternfly/react-data-view";
import UserIcon from "@patternfly/react-icons/dist/esm/icons/user-icon";
import UsersIcon from "@patternfly/react-icons/dist/esm/icons/users-icon";

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import {
  useObjectRolesQuery,
  useRemoveObjectRoleMutation,
} from "@app/queries/access";
import { getMutationErrorMessage } from "@app/utils/utils";

import { AddObjectRoleModal } from "./AddObjectRoleModal";

interface IObjectAccessPanelProps {
  href: string;
  /** The object's name, for titles and toasts. */
  name: string;
}

/**
 * Who holds which role on one object: a row per role with its users and groups.
 * Granting and revoking need the object's `manage_roles` permission.
 */
export const ObjectAccessPanel: React.FC<IObjectAccessPanelProps> = ({
  href,
  name,
}) => {
  const { addNotification } = useNotifications();
  const [isAdding, setIsAdding] = useState(false);
  const { data, isLoading, error } = useObjectRolesQuery({ href });
  const { can } = useObjectPermissions({ href });
  const canManage = can("manage_roles");
  const removeMutation = useRemoveObjectRoleMutation({
    onSuccess: (_data, { body }) =>
      addNotification({
        title: `Removed "${[...(body.users ?? []), ...(body.groups ?? [])].join(", ")}" from role "${body.role}"`,
        variant: "success",
      }),
    onError: (err) =>
      addNotification({
        variant: "danger",
        ...getMutationErrorMessage({
          error: err,
          fallback: "Failed to remove role",
        }),
      }),
  });
  const roles = data?.roles ?? [];

  const rows = roles.map((entry) => ({
    id: entry.role,
    row: [
      { cell: entry.role, props: { dataLabel: "Role" } },
      {
        cell: (
          <LabelGroup numLabels={10}>
            {(entry.users ?? []).map((user) => (
              <Label
                key={`user-${user}`}
                icon={<UserIcon />}
                onClose={
                  canManage
                    ? () =>
                        removeMutation.mutate({
                          href,
                          body: { role: entry.role, users: [user] },
                        })
                    : undefined
                }
                closeBtnAriaLabel={`Remove ${user} from ${entry.role}`}
              >
                {user}
              </Label>
            ))}
            {(entry.groups ?? []).map((group) => (
              <Label
                key={`group-${group}`}
                icon={<UsersIcon />}
                onClose={
                  canManage
                    ? () =>
                        removeMutation.mutate({
                          href,
                          body: { role: entry.role, groups: [group] },
                        })
                    : undefined
                }
                closeBtnAriaLabel={`Remove ${group} from ${entry.role}`}
              >
                {group}
              </Label>
            ))}
          </LabelGroup>
        ),
        props: { dataLabel: "Users and groups" },
      },
    ],
  }));

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: 2,
    isLoading,
    error,
    isEmpty: roles.length === 0,
    emptyState: (
      <TableEmptyState
        title="No roles granted"
        body={`No user or group holds a role on "${name}" itself. Roles granted for all objects still apply.`}
      />
    ),
  });

  const addButton = (
    <Button
      variant="secondary"
      onClick={() => setIsAdding(true)}
      isAriaDisabled={!canManage}
    >
      Add role
    </Button>
  );

  return (
    <>
      <DataView activeState={activeState}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              {canManage ? (
                addButton
              ) : (
                <Tooltip content="You don't have permission to manage access to this.">
                  {addButton}
                </Tooltip>
              )}
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
        <DataViewTable
          aria-label="Object roles"
          columns={[
            { cell: "Role", props: { width: 40 } },
            { cell: "Users and groups", props: { width: 60 } },
          ]}
          rows={rows}
          bodyStates={bodyStates}
        />
      </DataView>
      {isAdding && (
        <AddObjectRoleModal
          href={href}
          name={name}
          onClose={() => setIsAdding(false)}
        />
      )}
    </>
  );
};
