import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { EditablePulpLabels } from "./EditablePulpLabels";

vi.mock(import("@app/hooks/useNotifications"), () => ({
  useNotifications: vi.fn(() => ({ addNotification: vi.fn() })),
}));
vi.mock(import("@app/queries/labels"), () => ({
  useSetLabelMutation: vi.fn(),
  useUnsetLabelMutation: vi.fn(),
}));

const NO_PERMISSION = {
  isAriaDisabled: true,
  tooltipProps: { content: "You don't have permission to change this." },
};

describe("EditablePulpLabels", () => {
  it("offers Add label and per-label remove when editable", async () => {
    const screen = await render(
      <EditablePulpLabels
        href="/pulp/api/v3/repositories/file/file/1/"
        labels={{ env: "prod" }}
        invalidateKey={["repositories"]}
      />,
    );

    await expect
      .element(screen.getByRole("button", { name: "Add label" }))
      .toBeEnabled();
    await expect
      .element(screen.getByRole("button", { name: "Remove label env" }))
      .toBeVisible();
  });

  it("keeps Add label visible but disabled, with the reason, when read-only", async () => {
    const screen = await render(
      <EditablePulpLabels
        href="/pulp/api/v3/repositories/file/file/1/"
        labels={{ env: "prod" }}
        invalidateKey={["repositories"]}
        actionProps={NO_PERMISSION}
      />,
    );
    const addLabel = screen.getByRole("button", { name: "Add label" });

    await expect.element(addLabel).toHaveAttribute("aria-disabled", "true");
    await expect
      .element(screen.getByRole("button", { name: "Remove label env" }))
      .not.toBeInTheDocument();
    // The disabled label drops pointer events; its wrapper takes the hover.
    await userEvent.hover(addLabel.element().parentElement!);
    await expect
      .element(screen.getByText("You don't have permission to change this."))
      .toBeVisible();
  });
});
