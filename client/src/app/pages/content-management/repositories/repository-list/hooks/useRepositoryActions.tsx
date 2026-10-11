import { useTrackedDelete } from "@app/hooks/useTrackedDelete";
import { useRepositoryDeleteMutation } from "@app/queries/repositories";

/** Delete a repository, tracking the async task; rethrows so the modal stays open. */
export const useRepositoryActions = () => {
  const { deleteEntity, isDeleting } = useTrackedDelete({
    mutation: useRepositoryDeleteMutation(),
    label: "Repository",
  });
  return { deleteRepository: deleteEntity, isDeleting };
};
