import type { DistributionResponse } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
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
  const deleteMutation = useDistributionDeleteMutation();

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

  const deleteDistribution = (distribution: DistributionResponse) =>
    runAction(() => deleteMutation.mutateAsync(distribution.pulp_href ?? ""), {
      successTitle: `Distribution "${distribution.name}" deleted`,
      errorTitle: "Failed to delete distribution",
      taskAware: true,
      taskTitle: `Distribution "${distribution.name}" deletion started`,
    });

  return {
    createDistribution,
    updateDistribution,
    deleteDistribution,
    isDeleting: deleteMutation.isPending,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  };
};
