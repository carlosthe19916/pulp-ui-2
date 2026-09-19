import type { PatchedRole, Role } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import {
  useRoleCreateMutation,
  useRoleDeleteMutation,
  useRoleUpdateMutation,
} from "@app/queries/roles";

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

  const deleteRole = async (roleId: string, name: string) =>
    runAction(() => deleteMutation.mutateAsync(roleId), {
      successTitle: `Role "${name}" deleted`,
      errorTitle: "Failed to delete role",
    });

  return {
    createRole,
    updateRole,
    deleteRole,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
