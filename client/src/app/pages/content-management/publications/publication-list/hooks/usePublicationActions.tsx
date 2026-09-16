import { useMutationAction } from "@app/hooks/useMutationAction";
import { useFilePublicationDeleteMutation } from "@app/queries/file-publications";

/** Delete a publication with success/failure toasts; rethrows so callers can keep a modal open. */
export const usePublicationActions = () => {
  const { runAction } = useMutationAction();
  const deleteMutation = useFilePublicationDeleteMutation();

  const deletePublication = async (pubId: string, identifier: string) =>
    runAction(() => deleteMutation.mutateAsync(pubId), {
      successTitle: `Publication "${identifier}" deleted`,
      errorTitle: "Failed to delete publication",
    });

  return {
    deletePublication,
    isDeleting: deleteMutation.isPending,
  };
};
