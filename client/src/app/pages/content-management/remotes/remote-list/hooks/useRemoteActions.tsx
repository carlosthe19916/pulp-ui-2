import { useMutationAction } from "@app/hooks/useMutationAction";
import { useFileRemoteDeleteMutation } from "@app/queries/file-remotes";

/** Delete a remote with task/success/failure toasts; rethrows so callers can keep a modal open. */
export const useRemoteActions = () => {
  const { runAction } = useMutationAction();
  const deleteMutation = useFileRemoteDeleteMutation();

  const deleteRemote = async (remoteId: string, name: string) =>
    runAction(() => deleteMutation.mutateAsync(remoteId), {
      taskAware: true,
      taskTitle: `Remote "${name}" delete started`,
      successTitle: `Remote "${name}" deleted`,
      errorTitle: "Failed to delete remote",
    });

  return {
    deleteRemote,
    isDeleting: deleteMutation.isPending,
  };
};
