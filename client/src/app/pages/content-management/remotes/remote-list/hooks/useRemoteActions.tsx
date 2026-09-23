import type { GenericRemoteResponse } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import { useFileRemoteDeleteMutation } from "@app/queries/file-remotes";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

/** Delete a remote with task/success/failure toasts; rethrows so callers can keep a modal open. */
export const useRemoteActions = () => {
  const { runAction } = useMutationAction();
  const deleteMutation = useFileRemoteDeleteMutation();

  const deleteRemote = async (remote: GenericRemoteResponse) =>
    runAction(
      () =>
        deleteMutation.mutateAsync(extractIdFromHref(remote.pulp_href ?? "")),
      {
        taskAware: true,
        taskTitle: `Remote "${remote.name}" delete started`,
        successTitle: `Remote "${remote.name}" deleted`,
        errorTitle: "Failed to delete remote",
      },
    );

  return {
    deleteRemote,
    isDeleting: deleteMutation.isPending,
  };
};
