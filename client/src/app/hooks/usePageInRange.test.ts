import { describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import type { ListPaginationState } from "@app/utils/listState";

import { usePageInRange } from "./usePageInRange";

const renderPageInRange = ({
  pagination,
  count,
}: {
  pagination: ListPaginationState;
  count: number | undefined;
}) => {
  const setPagination = vi.fn();
  return {
    setPagination,
    rendered: renderHook(() =>
      usePageInRange({ pagination, setPagination, count }),
    ),
  };
};

describe("usePageInRange", () => {
  it("sends a page past the end back to the first page", async () => {
    const { setPagination, rendered } = renderPageInRange({
      pagination: { page: 3, perPage: 10 },
      count: 20,
    });
    await rendered;
    expect(setPagination).toHaveBeenCalledOnce();
    const update = setPagination.mock.calls[0][0] as (
      prev: ListPaginationState,
    ) => ListPaginationState;
    expect(update({ page: 3, perPage: 10 })).toEqual({ page: 1, perPage: 10 });
  });

  it("leaves the last page alone", async () => {
    const { setPagination, rendered } = renderPageInRange({
      pagination: { page: 2, perPage: 10 },
      count: 11,
    });
    await rendered;
    expect(setPagination).not.toHaveBeenCalled();
  });

  it("waits for the count before deciding", async () => {
    const { setPagination, rendered } = renderPageInRange({
      pagination: { page: 9, perPage: 10 },
      count: undefined,
    });
    await rendered;
    expect(setPagination).not.toHaveBeenCalled();
  });

  it("sends an emptied list back to the first page", async () => {
    const { setPagination, rendered } = renderPageInRange({
      pagination: { page: 2, perPage: 20 },
      count: 0,
    });
    await rendered;
    expect(setPagination).toHaveBeenCalledOnce();
  });
});
