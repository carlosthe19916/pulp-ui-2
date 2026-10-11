import type { GenericRemoteResponse } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import { useRemoteDeleteMutation } from "@app/queries/remotes";

/** Delete a remote; rethrows so the confirm modal stays open on failure. */
export const useRemoteActions = () => {
  const { runAction } = useMutationAction();
  const mutation = useRemoteDeleteMutation();

  const deleteRemote = (remote: GenericRemoteResponse) =>
    runAction(() => mutation.mutateAsync(remote.pulp_href ?? ""), {
      successTitle: `Remote "${remote.name}" deleted`,
      errorTitle: "Failed to delete remote",
      taskAware: true,
      taskTitle: `Remote "${remote.name}" deletion started`,
    });

  return { deleteRemote, isDeleting: mutation.isPending };
};
