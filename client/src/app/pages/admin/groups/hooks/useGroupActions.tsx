import type { Group, GroupResponse, PatchedGroup } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import {
  useGroupCreateMutation,
  useGroupDeleteMutation,
  useGroupUpdateMutation,
} from "@app/queries/groups";

/** Each action rethrows on failure so callers can keep a modal open on error. */
export const useGroupActions = () => {
  const { runAction } = useMutationAction();
  const createMutation = useGroupCreateMutation();
  const updateMutation = useGroupUpdateMutation();
  const deleteMutation = useGroupDeleteMutation();

  const createGroup = async (body: Group) =>
    runAction(() => createMutation.mutateAsync(body), {
      successTitle: (result) => `Group "${result.name}" created`,
      errorTitle: "Failed to create group",
    });

  const updateGroup = async (href: string, body: PatchedGroup) =>
    runAction(() => updateMutation.mutateAsync({ href, body }), {
      successTitle: (result) => `Group "${result.name}" updated`,
      errorTitle: "Failed to update group",
    });

  const deleteGroup = async (group: GroupResponse) =>
    runAction(() => deleteMutation.mutateAsync(group.pulp_href ?? ""), {
      successTitle: `Group "${group.name}" deleted`,
      errorTitle: "Failed to delete group",
    });

  return {
    createGroup,
    updateGroup,
    deleteGroup,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
