import type React from "react";
import { useEffect } from "react";

import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { Table, Tbody, Td, Tr } from "@patternfly/react-table";

import { RevealCellOnExpand } from "@app/components/RevealCellOnExpand";

const row = ({
  isExpanded,
  children,
}: {
  isExpanded: boolean;
  children: () => React.ReactNode;
}) => (
  // `isExpanded` drives PatternFly's native `hidden` attribute, the signal watched.
  <Table aria-label="Rows">
    <Tbody>
      <Tr isExpanded={isExpanded}>
        <Td>
          <RevealCellOnExpand>{children}</RevealCellOnExpand>
        </Td>
      </Tr>
    </Tbody>
  </Table>
);

interface IMarkerProps {
  onMount: () => void;
}

/** Reports each mount via `onMount`, so a remount (broken keep-alive) is visible. */
const Marker: React.FC<IMarkerProps> = ({ onMount }) => {
  useEffect(() => onMount(), [onMount]);
  return <span>detail</span>;
};

describe("RevealCellOnExpand", () => {
  it("does not build or render content while the row stays collapsed", async () => {
    const build = vi.fn(() => <span>detail</span>);
    const screen = await render(row({ isExpanded: false, children: build }));

    await expect.element(screen.getByText("detail")).not.toBeInTheDocument();
    expect(build).not.toHaveBeenCalled();
  });

  it("renders content when the row starts expanded", async () => {
    const screen = await render(
      row({ isExpanded: true, children: () => <span>detail</span> }),
    );

    await expect.element(screen.getByText("detail")).toBeVisible();
  });

  it("mounts content on first expand, then keeps it mounted when re-collapsed", async () => {
    const onMount = vi.fn();
    const children = () => <Marker onMount={onMount} />;

    const screen = await render(row({ isExpanded: false, children }));
    await expect.element(screen.getByText("detail")).not.toBeInTheDocument();
    expect(onMount).not.toHaveBeenCalled();

    // Expand: `hidden` clears and the content mounts once.
    await screen.rerender(row({ isExpanded: true, children }));
    await expect.element(screen.getByText("detail")).toBeVisible();
    expect(onMount).toHaveBeenCalledTimes(1);

    // Re-collapse then re-expand: content persists, never remounts (keep-alive).
    await screen.rerender(row({ isExpanded: false, children }));
    await expect.element(screen.getByText("detail")).toBeInTheDocument();
    await screen.rerender(row({ isExpanded: true, children }));
    await expect.element(screen.getByText("detail")).toBeVisible();
    expect(onMount).toHaveBeenCalledTimes(1);
  });
});
