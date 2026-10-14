import type { PublicationResponse } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import {
  usePublicationCreateMutation,
  usePublicationDeleteMutation,
} from "@app/queries/publications";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import type { PublicationWriteBody } from "../components/PublicationForm";

/**
 * The publication family's mutation hub. Publications are immutable (create + delete
 * only): create is an async task (202), delete is synchronous (204, no task — so no
 * row tracking, unlike the other families). Actions rethrow so dialogs stay open.
 */
export const usePublicationActions = () => {
  const { runAction } = useMutationAction();
  const createMutation = usePublicationCreateMutation();
  const deleteMutation = usePublicationDeleteMutation();

  const createPublication = async (
    apiPath: string,
    body: PublicationWriteBody,
  ) =>
    runAction(() => createMutation.mutateAsync({ apiPath, body }), {
      taskAware: true,
      successTitle: "Publication create started",
      taskTitle: "Publication create started",
      errorTitle: "Failed to create publication",
    });

  const deletePublication = async (publication: PublicationResponse) => {
    const pubId = extractIdFromHref(publication.pulp_href ?? "");
    return runAction(
      () => deleteMutation.mutateAsync(publication.pulp_href ?? ""),
      {
        successTitle: `Publication "${pubId}" deleted`,
        errorTitle: "Failed to delete publication",
      },
    );
  };

  return {
    createPublication,
    deletePublication,
    isDeleting: deleteMutation.isPending,
    isSubmitting: createMutation.isPending,
  };
};
