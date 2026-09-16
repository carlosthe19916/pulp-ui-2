import { useMutationAction } from "@app/hooks/useMutationAction";
import { useFileRepositoryDeleteMutation } from "@app/queries/file-repositories";

/** Delete a repository with task/success/failure toasts; rethrows so callers can keep a modal open. */
export const useRepositoryActions = () => {
  const { runAction } = useMutationAction();
  const deleteMutation = useFileRepositoryDeleteMutation();

  const deleteRepository = async (repoId: string, name: string) =>
    runAction(() => deleteMutation.mutateAsync(repoId), {
      taskAware: true,
      taskTitle: `Repository "${name}" delete started`,
      successTitle: `Repository "${name}" deleted`,
      errorTitle: "Failed to delete repository",
    });

  return {
    deleteRepository,
    isDeleting: deleteMutation.isPending,
  };
};
