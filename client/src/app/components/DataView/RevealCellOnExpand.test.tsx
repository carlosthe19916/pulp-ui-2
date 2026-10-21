import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Table, Tbody, Td, Tr } from "@patternfly/react-table";

import { RevealCellOnExpand } from "./RevealCellOnExpand";

// The repo has no @testing-library/dom, so render with react-dom/client directly.
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

const renderRow = async ({
  isExpanded,
  children,
}: {
  isExpanded: boolean;
  children: () => React.ReactNode;
}) =>
  act(async () => {
    // `isExpanded` drives PatternFly's native `hidden` attribute, the signal watched.
    root.render(
      <Table>
        <Tbody>
          <Tr isExpanded={isExpanded}>
            <Td>
              <RevealCellOnExpand>{children}</RevealCellOnExpand>
            </Td>
          </Tr>
        </Tbody>
      </Table>,
    );
  });

/** Reports each mount via `onMount`, so a remount (broken keep-alive) is visible. */
const Marker: React.FC<{ onMount: () => void }> = ({ onMount }) => {
  useEffect(() => onMount(), [onMount]);
  return <span>detail</span>;
};

describe("RevealCellOnExpand", () => {
  it("does not build or render content while the row stays collapsed", async () => {
    const build = vi.fn(() => <span>detail</span>);
    await renderRow({ isExpanded: false, children: build });

    expect(container.textContent).not.toContain("detail");
    expect(build).not.toHaveBeenCalled();
  });

  it("renders content when the row starts expanded", async () => {
    await renderRow({ isExpanded: true, children: () => <span>detail</span> });

    expect(container.textContent).toContain("detail");
  });

  it("mounts content on first expand, then keeps it mounted when re-collapsed", async () => {
    const onMount = vi.fn();
    const children = () => <Marker onMount={onMount} />;

    await renderRow({ isExpanded: false, children });
    expect(container.textContent).not.toContain("detail");
    expect(onMount).not.toHaveBeenCalled();

    // Expand: `hidden` clears and the content mounts once.
    await renderRow({ isExpanded: true, children });
    expect(container.textContent).toContain("detail");
    expect(onMount).toHaveBeenCalledTimes(1);

    // Re-collapse then re-expand: content persists, never remounts (keep-alive).
    await renderRow({ isExpanded: false, children });
    expect(container.textContent).toContain("detail");
    await renderRow({ isExpanded: true, children });
    expect(onMount).toHaveBeenCalledTimes(1);
  });
});
