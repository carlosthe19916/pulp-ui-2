import { useNotifications } from "@app/context/useNotifications";
import {
  useUserRoleCreateMutation,
  useUserRoleDeleteMutation,
} from "@app/queries/users";
import { getMutationErrorMessage } from "@app/utils/utils";

/**
 * Binds the user role assign/remove mutations to toast notifications.
 * Each action rethrows on failure so callers can react (e.g. keep selection).
 */
export const useUserRoleActions = () => {
  const { addNotification } = useNotifications();
  const roleCreateMutation = useUserRoleCreateMutation();
  const roleDeleteMutation = useUserRoleDeleteMutation();

  const addRole = async (userHref: string, role: string) => {
    try {
      await roleCreateMutation.mutateAsync({ userHref, body: { role } });
      addNotification({ title: "Role assigned", variant: "success" });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to assign role"),
        variant: "danger",
      });
      throw error;
    }
  };

  const removeRole = async (roleHref: string) => {
    try {
      await roleDeleteMutation.mutateAsync(roleHref);
      addNotification({ title: "Role removed", variant: "success" });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to remove role"),
        variant: "danger",
      });
      throw error;
    }
  };

  return {
    addRole,
    removeRole,
    isAdding: roleCreateMutation.isPending,
    isRemoving: roleDeleteMutation.isPending,
  };
};
