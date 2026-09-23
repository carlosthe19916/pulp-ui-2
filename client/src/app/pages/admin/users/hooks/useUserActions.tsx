import type { PatchedUser, UserResponse, UserWritable } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import {
  useUserCreateMutation,
  useUserDeleteMutation,
  useUserUpdateMutation,
} from "@app/queries/users";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

/** Each action rethrows on failure so callers can keep a modal open on error. */
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

  const updateUser = async (userId: string, body: PatchedUser) =>
    runAction(() => updateMutation.mutateAsync({ userId, body }), {
      successTitle: (result) => `User "${result.username}" updated`,
      errorTitle: "Failed to update user",
    });

  const deleteUser = async (user: UserResponse) =>
    runAction(
      () => deleteMutation.mutateAsync(extractIdFromHref(user.pulp_href ?? "")),
      {
        successTitle: `User "${user.username}" deleted`,
        errorTitle: "Failed to delete user",
      },
    );

  return {
    createUser,
    updateUser,
    deleteUser,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
