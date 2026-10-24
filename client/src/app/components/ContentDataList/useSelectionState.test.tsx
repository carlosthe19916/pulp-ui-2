import type React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { type ISelectionState, useSelectionState } from "./useSelectionState";

// The repo has no @testing-library/dom, so drive the hook with react-dom/client directly.
let container: HTMLElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const renderSelection = ({
  items,
  initialSelected,
}: {
  items: string[];
  initialSelected?: string[];
}): { current: ISelectionState<string> } => {
  const ref = { current: undefined as unknown as ISelectionState<string> };
  const Probe: React.FC = () => {
    ref.current = useSelectionState<string>({ items, initialSelected });
    return null;
  };
  act(() => root.render(<Probe />));
  return ref;
};

describe("useSelectionState", () => {
  it("starts empty and toggles a single item", () => {
    const state = renderSelection({ items: ["a", "b", "c"] });
    expect(state.current.isItemSelected("a")).toBe(false);

    act(() => state.current.toggleItem("a"));
    expect(state.current.isItemSelected("a")).toBe(true);
    expect(state.current.selectedItems).toEqual(["a"]);

    act(() => state.current.toggleItem("a"));
    expect(state.current.isItemSelected("a")).toBe(false);
    expect(state.current.selectedItems).toEqual([]);
  });

  it("tracks multiple items and areAllSelected", () => {
    const state = renderSelection({ items: ["a", "b"] });
    act(() => state.current.toggleItem("a"));
    act(() => state.current.toggleItem("b"));
    expect(state.current.areAllSelected).toBe(true);

    act(() => state.current.selectAll({ isSelecting: false }));
    expect(state.current.selectedItems).toEqual([]);
    expect(state.current.areAllSelected).toBe(false);
  });

  it("honors initialSelected and selectOnly", () => {
    const state = renderSelection({
      items: ["a", "b", "c"],
      initialSelected: ["b"],
    });
    expect(state.current.isItemSelected("b")).toBe(true);

    act(() => state.current.selectOnly(["c"]));
    expect(state.current.selectedItems).toEqual(["c"]);
  });
});
