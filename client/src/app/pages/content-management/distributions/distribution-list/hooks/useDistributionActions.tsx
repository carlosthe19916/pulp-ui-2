import type { DistributionResponse } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import { useDistributionDeleteMutation } from "@app/queries/distributions";

/** Delete a distribution; rethrows so the confirm modal stays open on failure. */
export const useDistributionActions = () => {
  const { runAction } = useMutationAction();
  const mutation = useDistributionDeleteMutation();

  const deleteDistribution = (distribution: DistributionResponse) =>
    runAction(() => mutation.mutateAsync(distribution.pulp_href ?? ""), {
      successTitle: `Distribution "${distribution.name}" deleted`,
      errorTitle: "Failed to delete distribution",
      taskAware: true,
      taskTitle: `Distribution "${distribution.name}" deletion started`,
    });

  return { deleteDistribution, isDeleting: mutation.isPending };
};
