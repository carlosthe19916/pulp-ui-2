import type { PatchedUser, UserWritable } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import {
  useUserCreateMutation,
  useUserDeleteMutation,
  useUserUpdateMutation,
} from "@app/queries/users";

/**
 * Binds the user create/update/delete mutations to success/failure toast
 * notifications so pages and modals don't have to repeat the wiring.
 *
 * Each action rethrows on failure so callers can keep a modal open on error.
 */
export const useUserActions = () => {
  const { runAction } = useMutationAction();
  const createMutation = useUserCreateMutation();
  const updateMutation = useUserUpdateMutation();
  const deleteMutation = useUserDeleteMutation();

  const createUser = async (body: UserWritable) =>
    runAction(() => createMutation.mutateAsync(body), {
      successTitle: (result) => `User "${result.username}" created`,
      errorTitle: "Failed to create user",
    });

  const updateUser = async (href: string, body: PatchedUser) =>
    runAction(() => updateMutation.mutateAsync({ href, body }), {
      successTitle: (result) => `User "${result.username}" updated`,
      errorTitle: "Failed to update user",
    });

  const deleteUser = async (href: string, username: string) =>
    runAction(() => deleteMutation.mutateAsync(href), {
      successTitle: `User "${username}" deleted`,
      errorTitle: "Failed to delete user",
    });

  return {
    createUser,
    updateUser,
    deleteUser,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
