import type { RepositoryResponse } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import { useRepositoryDeleteMutation } from "@app/queries/repositories";

/** Delete a repository; rethrows so the confirm modal stays open on failure. */
export const useRepositoryActions = () => {
  const { runAction } = useMutationAction();
  const mutation = useRepositoryDeleteMutation();

  const deleteRepository = (repository: RepositoryResponse) =>
    runAction(() => mutation.mutateAsync(repository.pulp_href ?? ""), {
      successTitle: `Repository "${repository.name}" deleted`,
      errorTitle: "Failed to delete repository",
      taskAware: true,
      taskTitle: `Repository "${repository.name}" deletion started`,
    });

  return { deleteRepository, isDeleting: mutation.isPending };
};
