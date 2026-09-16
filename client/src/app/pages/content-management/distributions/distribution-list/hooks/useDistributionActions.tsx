import { useMutationAction } from "@app/hooks/useMutationAction";
import { useFileDistributionDeleteMutation } from "@app/queries/file-distributions";

/** Delete a distribution with task/success/failure toasts; rethrows so callers can keep a modal open. */
export const useDistributionActions = () => {
  const { runAction } = useMutationAction();
  const deleteMutation = useFileDistributionDeleteMutation();

  const deleteDistribution = async (href: string, name: string) =>
    runAction(() => deleteMutation.mutateAsync(href), {
      taskAware: true,
      taskTitle: `Distribution "${name}" delete started`,
      successTitle: `Distribution "${name}" deleted`,
      errorTitle: "Failed to delete distribution",
    });

  return {
    deleteDistribution,
    isDeleting: deleteMutation.isPending,
  };
};
