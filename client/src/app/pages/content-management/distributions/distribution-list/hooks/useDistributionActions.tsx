import { useTrackedDelete } from "@app/hooks/useTrackedDelete";
import { useDistributionDeleteMutation } from "@app/queries/distributions";

/** Delete a distribution, tracking the async task; rethrows so the modal stays open. */
export const useDistributionActions = () => {
  const { deleteEntity, isDeleting } = useTrackedDelete({
    mutation: useDistributionDeleteMutation(),
    label: "Distribution",
  });
  return { deleteDistribution: deleteEntity, isDeleting };
};
