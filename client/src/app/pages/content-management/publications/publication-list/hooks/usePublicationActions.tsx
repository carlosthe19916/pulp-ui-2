import { useMutationAction } from "@app/hooks/useMutationAction";
import { useFilePublicationDeleteMutation } from "@app/queries/file-publications";

/**
 * Binds the publication delete mutation to success/failure toasts. Rethrows on
 * failure so callers can keep a modal open.
 */
export const usePublicationActions = () => {
  const { runAction } = useMutationAction();
  const deleteMutation = useFilePublicationDeleteMutation();

  const deletePublication = async (href: string, identifier: string) =>
    runAction(() => deleteMutation.mutateAsync(href), {
      successTitle: `Publication "${identifier}" deleted`,
      errorTitle: "Failed to delete publication",
    });

  return {
    deletePublication,
    isDeleting: deleteMutation.isPending,
  };
};
