import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { StringListField } from "./StringListField";

describe("StringListField", () => {
  it("adds the typed value on Enter", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <StringListField
        id="tags"
        label="Include tags"
        value={["latest"]}
        isDisabled={false}
        onChange={onChange}
      />,
    );
    await screen.getByRole("textbox", { name: "Include tags" }).click();
    await userEvent.keyboard("stable{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(["latest", "stable"]);
  });

  it("removes a value with its close button", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <StringListField
        id="tags"
        label="Include tags"
        value={["latest", "stable"]}
        isDisabled={false}
        onChange={onChange}
      />,
    );
    await screen.getByRole("button", { name: /close latest/i }).click();
    expect(onChange).toHaveBeenLastCalledWith(["stable"]);
  });
});
