import { useNotifications } from "@app/context/useNotifications";
import { useUserRolesSyncMutation } from "@app/queries/users";
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
 * Binds the batch user-role sync mutation to a single toast notification.
 * Applies all additions and removals in one batch (invalidating once) and
 * rethrows on failure so callers can keep the modal open.
 */
export const useUserRoleActions = () => {
  const { addNotification } = useNotifications();
  const rolesSyncMutation = useUserRolesSyncMutation();

  const syncRoles = async ({ userHref, toAdd, toRemove }: ISyncRolesArgs) => {
    if (toAdd.length === 0 && toRemove.length === 0) {
      return;
    }
    try {
      await rolesSyncMutation.mutateAsync({ userHref, toAdd, toRemove });
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
    isSaving: rolesSyncMutation.isPending,
  };
};
