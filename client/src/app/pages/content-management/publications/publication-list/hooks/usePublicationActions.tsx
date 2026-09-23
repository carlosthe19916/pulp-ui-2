import type { PublicationResponse } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import { useFilePublicationDeleteMutation } from "@app/queries/file-publications";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

/** Delete a publication with success/failure toasts; rethrows so callers can keep a modal open. */
export const usePublicationActions = () => {
  const { runAction } = useMutationAction();
  const deleteMutation = useFilePublicationDeleteMutation();

  const deletePublication = async (publication: PublicationResponse) => {
    const identifier = extractIdFromHref(publication.pulp_href ?? "");
    return runAction(() => deleteMutation.mutateAsync(identifier), {
      successTitle: `Publication "${identifier}" deleted`,
      errorTitle: "Failed to delete publication",
    });
  };

  return {
    deletePublication,
    isDeleting: deleteMutation.isPending,
  };
};
