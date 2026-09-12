import type { PatchedUser, UserWritable } from "@app/client";
import { useNotifications } from "@app/context/useNotifications";
import {
  useUserCreateMutation,
  useUserDeleteMutation,
  useUserUpdateMutation,
} from "@app/queries/users";
import { getMutationErrorMessage } from "@app/utils/utils";

/**
 * Binds the user create/update/delete mutations to success/failure toast
 * notifications so pages and modals don't have to repeat the wiring.
 *
 * Each action rethrows on failure so callers can keep a modal open on error.
 */
export const useUserActions = () => {
  const { addNotification } = useNotifications();
  const createMutation = useUserCreateMutation();
  const updateMutation = useUserUpdateMutation();
  const deleteMutation = useUserDeleteMutation();

  const createUser = async (body: UserWritable) => {
    try {
      const result = await createMutation.mutateAsync(body);
      addNotification({ title: "User created", variant: "success" });
      return result;
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to create user"),
        variant: "danger",
      });
      throw error;
    }
  };

  const updateUser = async (href: string, body: PatchedUser) => {
    try {
      const result = await updateMutation.mutateAsync({ href, body });
      addNotification({ title: "User updated", variant: "success" });
      return result;
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to update user"),
        variant: "danger",
      });
      throw error;
    }
  };

  const deleteUser = async (href: string) => {
    try {
      await deleteMutation.mutateAsync(href);
      addNotification({ title: "User deleted", variant: "success" });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete user"),
        variant: "danger",
      });
      throw error;
    }
  };

  return {
    createUser,
    updateUser,
    deleteUser,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
