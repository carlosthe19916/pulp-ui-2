import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { GatedButton } from "./GatedButton";

describe("GatedButton", () => {
  it("runs onClick when not disabled", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <GatedButton onClick={onClick}>Remove</GatedButton>,
    );

    await screen.getByRole("button", { name: "Remove" }).click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("stays focusable, ignores clicks and shows the reason when aria-disabled", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <GatedButton
        onClick={onClick}
        isAriaDisabled
        tooltipProps={{ content: "Wait for the running task to finish" }}
      >
        Remove
      </GatedButton>,
    );
    const button = screen.getByRole("button", { name: "Remove" });

    await expect.element(button).toHaveAttribute("aria-disabled", "true");
    await button.hover();
    await expect
      .element(screen.getByText("Wait for the running task to finish"))
      .toBeVisible();
    await button.click({ force: true });
    expect(onClick).not.toHaveBeenCalled();
  });
});
