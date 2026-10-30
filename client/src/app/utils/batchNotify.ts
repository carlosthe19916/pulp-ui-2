import type { INotificationsContextValue } from "@app/context/Notifications/NotificationsContext";
import type { IBatchResult } from "@app/queries/utils/settleBatch";
import { getMutationErrorMessage } from "@app/utils/utils";

const countOf = ({ count, item }: { count: number; item: string }) =>
  `${count} ${item}${count === 1 ? "" : "s"}`;

interface INotifyBatchResultOptions {
  addNotification: INotificationsContextValue["addNotification"];
  result: IBatchResult;
  /** Singular noun for one added item, e.g. "user". */
  item: string;
  /** What the items were added to, e.g. `group "admins"`. */
  target: string;
}

/**
 * Toasts a batch add: one success toast, and one danger toast naming what failed with the
 * server's reason, so a partial failure is never silent.
 */
export const notifyBatchResult = ({
  addNotification,
  result: { succeeded, failed },
  item,
  target,
}: INotifyBatchResultOptions) => {
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

interface INotifyLabelsResultOptions {
  addNotification: INotificationsContextValue["addNotification"];
  result: IBatchResult;
}

/**
 * Toasts the outcome of a batch of label `set_label/` / `unset_label/` changes: one success
 * toast, and one danger toast naming the labels that failed with the server's reason.
 */
export const notifyLabelsResult = ({
  addNotification,
  result: { succeeded, failed },
}: INotifyLabelsResultOptions) => {
  if (succeeded.length > 0) {
    addNotification({
      title: `${countOf({ count: succeeded.length, item: "label" })} updated`,
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
      variant: "danger",
      title: `Failed to update ${countOf({
        count: failed.length,
        item: "label",
      })}: ${failed.map((failure) => failure.label).join(", ")}`,
      description,
    });
  }
};
