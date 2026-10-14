import { useMutationAction } from "@app/hooks/useMutationAction";
import { useTrackedDelete } from "@app/hooks/useTrackedDelete";
import {
  useDistributionCreateMutation,
  useDistributionDeleteMutation,
  useDistributionUpdateMutation,
} from "@app/queries/distributions";

import type { DistributionWriteBody } from "../components/DistributionForm";

/**
 * The distribution family's mutation hub (mirrors `useRepositoryActions`): create /
 * update / delete via the distribution query module. Each action wraps the mutation in
 * toasts and **rethrows** so the modal / confirm dialog stays open on failure.
 */
export const useDistributionActions = () => {
  const { runAction } = useMutationAction();
  const createMutation = useDistributionCreateMutation();
  const updateMutation = useDistributionUpdateMutation();
  const { deleteEntity, isDeleting } = useTrackedDelete({
    mutation: useDistributionDeleteMutation(),
    label: "Distribution",
  });

  const createDistribution = async (
    apiPath: string,
    body: DistributionWriteBody,
  ) =>
    runAction(() => createMutation.mutateAsync({ apiPath, body }), {
      taskAware: true,
      successTitle: `Distribution "${body.name}" created`,
      taskTitle: `Distribution "${body.name}" create started`,
      errorTitle: "Failed to create distribution",
    });

  const updateDistribution = async (
    href: string,
    name: string | undefined,
    body: Partial<DistributionWriteBody>,
  ) =>
    runAction(() => updateMutation.mutateAsync({ href, body }), {
      successTitle: `Distribution "${name}" updated`,
      errorTitle: "Failed to update distribution",
    });

  return {
    createDistribution,
    updateDistribution,
    deleteDistribution: deleteEntity,
    isDeleting,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  };
};
