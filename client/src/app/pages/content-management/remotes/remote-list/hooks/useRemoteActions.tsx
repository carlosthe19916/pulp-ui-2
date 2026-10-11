import { use } from "react";

import type { GenericRemoteResponse } from "@app/client";
import { useMutationAction } from "@app/hooks/useMutationAction";
import { useRemoteDeleteMutation } from "@app/queries/remotes";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { RemoteTaskTrackerContext } from "../context/RemoteTaskTrackerContext";

/** Deletes a remote and tracks the async task; rethrows so the modal stays open on failure. */
export const useRemoteActions = () => {
  const { runAction } = useMutationAction();
  const { track } = use(RemoteTaskTrackerContext);
  const deleteMutation = useRemoteDeleteMutation();

  const deleteRemote = async (remote: GenericRemoteResponse) => {
    const remoteId = extractIdFromHref(remote.pulp_href ?? "");
    const result = await runAction(
      () => deleteMutation.mutateAsync(remote.pulp_href ?? ""),
      {
        successTitle: `Remote "${remote.name}" deleted`,
        errorTitle: "Failed to delete remote",
        taskAware: true,
        taskTitle: `Remote "${remote.name}" deletion started`,
      },
    );
    if (result.task) {
      track(remoteId, { kind: "delete", taskHref: result.task });
    }
    return result;
  };

  return {
    deleteRemote,
    isDeleting: deleteMutation.isPending,
  };
};
