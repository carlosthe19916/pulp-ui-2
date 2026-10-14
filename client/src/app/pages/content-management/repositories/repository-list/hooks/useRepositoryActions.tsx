import { useMutationAction } from "@app/hooks/useMutationAction";
import { useTrackedDelete } from "@app/hooks/useTrackedDelete";
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
  const { deleteEntity, isDeleting } = useTrackedDelete({
    mutation: useRepositoryDeleteMutation(),
    label: "Repository",
  });

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

  return {
    createRepository,
    updateRepository,
    deleteRepository: deleteEntity,
    isDeleting,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  };
};
