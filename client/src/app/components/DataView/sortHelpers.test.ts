import type React from "react";
import { describe, expect, it, vi } from "vitest";

import { buildThSort } from "./sortHelpers";

describe("buildThSort", () => {
  const columnKeys = ["username", "email", "date_joined"];

  it("marks the active column with its index and direction", () => {
    const sort = buildThSort({
      columnKeys,
      columnIndex: 2,
      sortBy: "date_joined",
      direction: "desc",
      onSort: vi.fn(),
    });

    expect(sort?.columnIndex).toBe(2);
    expect(sort?.sortBy).toEqual({ index: 2, direction: "desc" });
  });

  it("leaves index/direction unset for non-active columns", () => {
    const sort = buildThSort({
      columnKeys,
      columnIndex: 0,
      sortBy: undefined,
      direction: undefined,
      onSort: vi.fn(),
    });

    expect(sort?.sortBy).toEqual({ index: undefined, direction: undefined });
  });

  it("bridges PatternFly's index-based onSort back to the column key", () => {
    const onSort = vi.fn();
    const sort = buildThSort({
      columnKeys,
      columnIndex: 0,
      sortBy: "username",
      direction: "asc",
      onSort,
    });

    sort?.onSort?.({} as React.MouseEvent, 0, "desc" as never, {} as never);

    expect(onSort).toHaveBeenCalledWith(expect.anything(), "username", "desc");
  });
});
