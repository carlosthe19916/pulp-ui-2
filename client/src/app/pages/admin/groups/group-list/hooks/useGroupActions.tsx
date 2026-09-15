import type { Group } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import {
  useGroupCreateMutation,
  useGroupDeleteMutation,
} from "@app/queries/groups";

/**
 * Binds the group create/delete mutations to success/failure toast
 * notifications. Each action rethrows on failure so callers can keep a modal
 * open on error. Mirrors `useUserActions`.
 */
export const useGroupActions = () => {
  const { runAction } = useMutationAction();
  const createMutation = useGroupCreateMutation();
  const deleteMutation = useGroupDeleteMutation();

  const createGroup = async (body: Group) =>
    runAction(() => createMutation.mutateAsync(body), {
      successTitle: (result) => `Group "${result.name}" created`,
      errorTitle: "Failed to create group",
    });

  const deleteGroup = async (href: string, name: string) =>
    runAction(() => deleteMutation.mutateAsync(href), {
      successTitle: `Group "${name}" deleted`,
      errorTitle: "Failed to delete group",
    });

  return {
    createGroup,
    deleteGroup,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
