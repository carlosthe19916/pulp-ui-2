import { useTrackedDelete } from "@app/hooks/useTrackedDelete";
import { useRemoteDeleteMutation } from "@app/queries/remotes";

/** Delete a remote, tracking the async task; rethrows so the modal stays open. */
export const useRemoteActions = () => {
  const { deleteEntity, isDeleting } = useTrackedDelete({
    mutation: useRemoteDeleteMutation(),
    label: "Remote",
  });
  return { deleteRemote: deleteEntity, isDeleting };
};
