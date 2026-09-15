import { useMutationAction } from "@app/hooks/useMutationAction";
import { useFileRepositoryDeleteMutation } from "@app/queries/file-repositories";

/**
 * Binds the repository delete mutation to task/success/failure toasts.
 * Deletion is asynchronous, so a task-started toast is shown when the API
 * returns a task href. Rethrows on failure so callers can keep a modal open.
 */
export const useRepositoryActions = () => {
  const { runAction } = useMutationAction();
  const deleteMutation = useFileRepositoryDeleteMutation();

  const deleteRepository = async (href: string, name: string) =>
    runAction(() => deleteMutation.mutateAsync(href), {
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
