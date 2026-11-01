import { useEffect } from "react";

import type { ListPaginationState } from "@app/utils/listState";

import type { PersistentStateSetter } from "./usePersistentState";

interface IUsePageInRangeOptions {
  pagination: ListPaginationState;
  setPagination: PersistentStateSetter<ListPaginationState>;
  /** The list's total from the server; `undefined` while it loads. */
  count: number | undefined;
}

/**
 * Sends a list back to its first page when its page is past the end (ADR 0014): a stale link,
 * or the last row of the last page deleted.
 */
export const usePageInRange = ({
  pagination,
  setPagination,
  count,
}: IUsePageInRangeOptions) => {
  const isPastEnd =
    count !== undefined &&
    pagination.page > 1 &&
    (pagination.page - 1) * pagination.perPage >= count;

  // An effect, not a render-time clamp: the page lives in the URL or storage, which must change too.
  useEffect(() => {
    if (isPastEnd) setPagination((prev) => ({ ...prev, page: 1 }));
  }, [isPastEnd, setPagination]);
};
