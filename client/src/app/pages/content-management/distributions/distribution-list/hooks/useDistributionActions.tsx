import type { DistributionResponse } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import { useFileDistributionDeleteMutation } from "@app/queries/file-distributions";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

/** Delete a distribution with task/success/failure toasts; rethrows so callers can keep a modal open. */
export const useDistributionActions = () => {
  const { runAction } = useMutationAction();
  const deleteMutation = useFileDistributionDeleteMutation();

  const deleteDistribution = async (distribution: DistributionResponse) =>
    runAction(
      () =>
        deleteMutation.mutateAsync(
          extractIdFromHref(distribution.pulp_href ?? ""),
        ),
      {
        taskAware: true,
        taskTitle: `Distribution "${distribution.name}" delete started`,
        successTitle: `Distribution "${distribution.name}" deleted`,
        errorTitle: "Failed to delete distribution",
      },
    );

  return {
    deleteDistribution,
    isDeleting: deleteMutation.isPending,
  };
};
