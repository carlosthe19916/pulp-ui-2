import { use } from "react";

import type { RepositoryResponse } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import { useRepositoryDeleteMutation } from "@app/queries/repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { RepositoryTaskTrackerContext } from "../context/RepositoryTaskTrackerContext";

/** Deletes a repository and tracks the async task; rethrows so the modal stays open on failure. */
export const useRepositoryActions = () => {
  const { runAction } = useMutationAction();
  const { track } = use(RepositoryTaskTrackerContext);
  const deleteMutation = useRepositoryDeleteMutation();

  const deleteRepository = async (repository: RepositoryResponse) => {
    const repositoryId = extractIdFromHref(repository.pulp_href ?? "");
    const result = await runAction(
      () => deleteMutation.mutateAsync(repository.pulp_href ?? ""),
      {
        successTitle: `Repository "${repository.name}" deleted`,
        errorTitle: "Failed to delete repository",
        taskAware: true,
        taskTitle: `Repository "${repository.name}" deletion started`,
      },
    );
    if (result.task) {
      track(repositoryId, { kind: "delete", taskHref: result.task });
    }
    return result;
  };

  return {
    deleteRepository,
    isDeleting: deleteMutation.isPending,
  };
};
