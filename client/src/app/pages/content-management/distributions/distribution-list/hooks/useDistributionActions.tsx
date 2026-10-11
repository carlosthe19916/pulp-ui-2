import { use } from "react";

import type { DistributionResponse } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import { useDistributionDeleteMutation } from "@app/queries/distributions";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { DistributionTaskTrackerContext } from "../context/DistributionTaskTrackerContext";

/** Deletes a distribution and tracks the async task; rethrows so the modal stays open on failure. */
export const useDistributionActions = () => {
  const { runAction } = useMutationAction();
  const { track } = use(DistributionTaskTrackerContext);
  const deleteMutation = useDistributionDeleteMutation();

  const deleteDistribution = async (distribution: DistributionResponse) => {
    const distributionId = extractIdFromHref(distribution.pulp_href ?? "");
    const result = await runAction(
      () => deleteMutation.mutateAsync(distribution.pulp_href ?? ""),
      {
        successTitle: `Distribution "${distribution.name}" deleted`,
        errorTitle: "Failed to delete distribution",
        taskAware: true,
        taskTitle: `Distribution "${distribution.name}" deletion started`,
      },
    );
    if (result.task) {
      track(distributionId, { kind: "delete", taskHref: result.task });
    }
    return result;
  };

  return {
    deleteDistribution,
    isDeleting: deleteMutation.isPending,
  };
};
