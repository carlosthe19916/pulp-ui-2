import { useMutationAction } from "@app/hooks/useMutationAction";
import { useTrackedDelete } from "@app/hooks/useTrackedDelete";
import {
  useRemoteCreateMutation,
  useRemoteDeleteMutation,
  useRemoteUpdateMutation,
} from "@app/queries/remotes";

import type { RemoteWriteBody } from "../components/RemoteForm";

/**
 * The remote family's mutation hub (mirrors `useRepositoryActions`): create / update /
 * delete via the remote query module. Each action wraps the mutation in toasts and
 * **rethrows** so the modal / confirm dialog stays open on failure.
 */
export const useRemoteActions = () => {
  const { runAction } = useMutationAction();
  const createMutation = useRemoteCreateMutation();
  const updateMutation = useRemoteUpdateMutation();
  const { deleteEntity, isDeleting } = useTrackedDelete({
    mutation: useRemoteDeleteMutation(),
    label: "Remote",
  });

  const createRemote = async (apiPath: string, body: RemoteWriteBody) =>
    runAction(() => createMutation.mutateAsync({ apiPath, body }), {
      successTitle: (result) => `Remote "${result?.name ?? body.name}" created`,
      errorTitle: "Failed to create remote",
    });

  const updateRemote = async (
    href: string,
    name: string | undefined,
    body: Partial<RemoteWriteBody>,
  ) =>
    runAction(() => updateMutation.mutateAsync({ href, body }), {
      successTitle: `Remote "${name}" updated`,
      errorTitle: "Failed to update remote",
    });

  return {
    createRemote,
    updateRemote,
    deleteRemote: deleteEntity,
    isDeleting,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  };
};
