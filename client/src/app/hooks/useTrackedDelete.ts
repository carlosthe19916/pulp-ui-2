import { use } from "react";

import type { AsyncOperationResponse } from "@app/client";
import { EntityTaskTrackerContext } from "@app/context/EntityTaskTracker/EntityTaskTrackerContext";
import { useMutationAction } from "@app/hooks/useMutationAction";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

interface IDeletableEntity {
  pulp_href?: string | null;
  name?: string | null;
}

interface IEntityDeleteMutation {
  mutateAsync: (href: string) => Promise<AsyncOperationResponse>;
  isPending: boolean;
}

/**
 * Shared delete action for the per-family action hooks: runs the dedicated delete
 * mutation (task/success/error toasts) and, on a 202, tracks the task so the row
 * shows a spinner. Rethrows so the confirm modal stays open on failure.
 */
export const useTrackedDelete = ({
  mutation,
  label,
}: {
  mutation: IEntityDeleteMutation;
  /** Display label, e.g. "Remote" — lower-cased for the error toast. */
  label: string;
}) => {
  const { runAction } = useMutationAction();
  const { track } = use(EntityTaskTrackerContext);

  const deleteEntity = async (entity: IDeletableEntity) => {
    const id = extractIdFromHref(entity.pulp_href ?? "");
    const result = await runAction(
      () => mutation.mutateAsync(entity.pulp_href ?? ""),
      {
        successTitle: `${label} "${entity.name}" deleted`,
        errorTitle: `Failed to delete ${label.toLowerCase()}`,
        taskAware: true,
        taskTitle: `${label} "${entity.name}" deletion started`,
      },
    );
    if (result.task) {
      track(id, { kind: "delete", taskHref: result.task });
    }
    return result;
  };

  return { deleteEntity, isDeleting: mutation.isPending };
};
