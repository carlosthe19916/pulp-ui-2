import { useMutationAction } from "@app/hooks/useMutationAction";
import { useFileRemoteDeleteMutation } from "@app/queries/file-remotes";

/**
 * Binds the remote delete mutation to task/success/failure toasts. Deletion
 * may be asynchronous, so a task-started toast is shown when the API returns a
 * task href. Rethrows on failure so callers can keep a modal open.
 */
export const useRemoteActions = () => {
  const { runAction } = useMutationAction();
  const deleteMutation = useFileRemoteDeleteMutation();

  const deleteRemote = async (href: string, name: string) =>
    runAction(() => deleteMutation.mutateAsync(href), {
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
