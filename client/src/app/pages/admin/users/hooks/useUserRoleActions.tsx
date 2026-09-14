import { useNotifications } from "@app/context/useNotifications";
import {
  useUserRoleCreateMutation,
  useUserRoleDeleteMutation,
} from "@app/queries/users";
import { getMutationErrorMessage } from "@app/utils/utils";

interface ISyncRolesArgs {
  /** Href of the user whose roles are being changed. */
  userHref: string;
  /** Role names to assign. */
  toAdd: string[];
  /** Assignment hrefs (UserRoleResponse.pulp_href) to unassign. */
  toRemove: string[];
}

/**
 * Binds the user role assign/remove mutations to a single toast notification.
 * Applies all additions and removals in one batch and rethrows on failure so
 * callers can keep the modal open.
 */
export const useUserRoleActions = () => {
  const { addNotification } = useNotifications();
  const roleCreateMutation = useUserRoleCreateMutation();
  const roleDeleteMutation = useUserRoleDeleteMutation();

  const syncRoles = async ({ userHref, toAdd, toRemove }: ISyncRolesArgs) => {
    if (toAdd.length === 0 && toRemove.length === 0) {
      return;
    }
    try {
      await Promise.all([
        ...toAdd.map((role) =>
          // content_object is required by the API; null assigns a model-level role.
          roleCreateMutation.mutateAsync({
            userHref,
            body: { role, content_object: null },
          }),
        ),
        ...toRemove.map((roleHref) => roleDeleteMutation.mutateAsync(roleHref)),
      ]);
      addNotification({ title: "Roles updated", variant: "success" });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to update roles"),
        variant: "danger",
      });
      throw error;
    }
  };

  return {
    syncRoles,
    isSaving: roleCreateMutation.isPending || roleDeleteMutation.isPending,
  };
};
