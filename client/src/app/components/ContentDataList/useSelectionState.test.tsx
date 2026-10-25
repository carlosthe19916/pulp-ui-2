import { describe, expect, it } from "vitest";
import { renderHook } from "vitest-browser-react";

import { useSelectionState } from "./useSelectionState";

const renderSelection = (options: {
  items: string[];
  initialSelected?: string[];
}) => renderHook(() => useSelectionState<string>(options));

describe("useSelectionState", () => {
  it("starts empty and toggles a single item", async () => {
    const { result, act } = await renderSelection({ items: ["a", "b", "c"] });
    expect(result.current.isItemSelected("a")).toBe(false);

    await act(() => result.current.toggleItem("a"));
    expect(result.current.isItemSelected("a")).toBe(true);
    expect(result.current.selectedItems).toEqual(["a"]);

    await act(() => result.current.toggleItem("a"));
    expect(result.current.isItemSelected("a")).toBe(false);
    expect(result.current.selectedItems).toEqual([]);
  });

  it("tracks multiple items and areAllSelected", async () => {
    const { result, act } = await renderSelection({ items: ["a", "b"] });
    await act(() => result.current.toggleItem("a"));
    await act(() => result.current.toggleItem("b"));
    expect(result.current.areAllSelected).toBe(true);

    await act(() => result.current.selectAll({ isSelecting: false }));
    expect(result.current.selectedItems).toEqual([]);
    expect(result.current.areAllSelected).toBe(false);
  });

  it("honors initialSelected and selectOnly", async () => {
    const { result, act } = await renderSelection({
      items: ["a", "b", "c"],
      initialSelected: ["b"],
    });
    expect(result.current.isItemSelected("b")).toBe(true);

    await act(() => result.current.selectOnly(["c"]));
    expect(result.current.selectedItems).toEqual(["c"]);
  });
});
