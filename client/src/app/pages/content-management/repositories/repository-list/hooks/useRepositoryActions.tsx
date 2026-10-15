import type { RepositoryResponse } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import {
  useRepositoryCreateMutation,
  useRepositoryDeleteMutation,
  useRepositoryUpdateMutation,
} from "@app/queries/repositories";

import type { RepositoryWriteBody } from "../components/RepositoryForm";

/**
 * The repository family's mutation hub (mirrors `useUserActions`): create / update /
 * delete via the repository query module. Each action wraps the mutation in
 * success/error toasts and **rethrows** so the modal / confirm dialog stays open on
 * failure.
 */
export const useRepositoryActions = () => {
  const { runAction } = useMutationAction();
  const createMutation = useRepositoryCreateMutation();
  const updateMutation = useRepositoryUpdateMutation();
  const deleteMutation = useRepositoryDeleteMutation();

  const createRepository = async (apiPath: string, body: RepositoryWriteBody) =>
    runAction(() => createMutation.mutateAsync({ apiPath, body }), {
      successTitle: (result) =>
        `Repository "${result?.name ?? body.name}" created`,
      errorTitle: "Failed to create repository",
    });

  const updateRepository = async (
    href: string,
    name: string | undefined,
    body: Partial<RepositoryWriteBody>,
  ) =>
    runAction(() => updateMutation.mutateAsync({ href, body }), {
      successTitle: `Repository "${name}" updated`,
      errorTitle: "Failed to update repository",
    });

  const deleteRepository = (repository: RepositoryResponse) =>
    runAction(() => deleteMutation.mutateAsync(repository.pulp_href ?? ""), {
      successTitle: `Repository "${repository.name}" deleted`,
      errorTitle: "Failed to delete repository",
      taskAware: true,
      taskTitle: `Repository "${repository.name}" deletion started`,
    });

  return {
    createRepository,
    updateRepository,
    deleteRepository,
    isDeleting: deleteMutation.isPending,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  };
};
