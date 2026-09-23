import type { RepositoryResponse } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import { useFileRepositoryDeleteMutation } from "@app/queries/file-repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

/** Delete a repository with task/success/failure toasts; rethrows so callers can keep a modal open. */
export const useRepositoryActions = () => {
  const { runAction } = useMutationAction();
  const deleteMutation = useFileRepositoryDeleteMutation();

  const deleteRepository = async (repository: RepositoryResponse) =>
    runAction(
      () =>
        deleteMutation.mutateAsync(
          extractIdFromHref(repository.pulp_href ?? ""),
        ),
      {
        taskAware: true,
        taskTitle: `Repository "${repository.name}" delete started`,
        successTitle: `Repository "${repository.name}" deleted`,
        errorTitle: "Failed to delete repository",
      },
    );

  return {
    deleteRepository,
    isDeleting: deleteMutation.isPending,
  };
};
