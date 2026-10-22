import type { INotificationsContextValue } from "@app/context/Notifications/NotificationsContext";
import type { IBatchResult } from "@app/queries/utils/settleBatch";
import { getMutationErrorMessage } from "@app/utils/utils";

const countOf = ({ count, item }: { count: number; item: string }) =>
  `${count} ${item}${count === 1 ? "" : "s"}`;

/**
 * Toasts for a batch add: one success toast for what went through and one
 * danger toast naming what didn't (with the server's reason), so a partial
 * failure is never silent.
 *
 * @example
 * notifyBatchResult({ addNotification, result, item: "role", target: 'user "bob"' })
 * // "2 roles added to user "bob"" + "Failed to add 1 role to user "bob": admin"
 * // (the second with the first failure's server message as its description)
 */
export const notifyBatchResult = ({
  addNotification,
  result: { succeeded, failed },
  item,
  target,
}: {
  addNotification: INotificationsContextValue["addNotification"];
  result: IBatchResult;
  /** Singular noun for one added item, e.g. "user". */
  item: string;
  /** What the items were added to, e.g. `group "admins"`. */
  target: string;
}) => {
  if (succeeded.length > 0) {
    addNotification({
      title: `${countOf({ count: succeeded.length, item })} added to ${target}`,
      variant: "success",
    });
  }
  if (failed.length > 0) {
    // Show why with the first failure's server message (e.g. a 403).
    const { description } = getMutationErrorMessage({
      error: failed[0].error,
      fallback: "",
    });
    addNotification({
      title: `Failed to add ${countOf({ count: failed.length, item })} to ${target}: ${failed
        .map((failure) => failure.label)
        .join(", ")}`,
      description,
      variant: "danger",
    });
  }
};
