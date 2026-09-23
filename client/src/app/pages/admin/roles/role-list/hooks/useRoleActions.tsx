import type { PatchedRole, Role, RoleResponse } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import {
  useRoleCreateMutation,
  useRoleDeleteMutation,
  useRoleUpdateMutation,
} from "@app/queries/roles";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

/** Each action rethrows on failure so callers can keep a modal open on error. */
export const useRoleActions = () => {
  const { runAction } = useMutationAction();
  const createMutation = useRoleCreateMutation();
  const updateMutation = useRoleUpdateMutation();
  const deleteMutation = useRoleDeleteMutation();

  const createRole = async (body: Role) =>
    runAction(() => createMutation.mutateAsync(body), {
      successTitle: (result) => `Role "${result.name}" created`,
      errorTitle: "Failed to create role",
    });

  const updateRole = async (roleId: string, body: PatchedRole) =>
    runAction(() => updateMutation.mutateAsync({ roleId, body }), {
      successTitle: (result) => `Role "${result.name}" updated`,
      errorTitle: "Failed to update role",
    });

  const deleteRole = async (role: RoleResponse) =>
    runAction(
      () => deleteMutation.mutateAsync(extractIdFromHref(role.pulp_href ?? "")),
      {
        successTitle: `Role "${role.name}" deleted`,
        errorTitle: "Failed to delete role",
      },
    );

  return {
    createRole,
    updateRole,
    deleteRole,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
