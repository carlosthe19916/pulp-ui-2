import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { KeyValueField } from "./KeyValueField";

describe("KeyValueField", () => {
  it("adds an empty row", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <KeyValueField
        id="headers"
        label="Header"
        value={[]}
        isDisabled={false}
        onChange={onChange}
      />,
    );
    await screen.getByRole("button", { name: "Add header" }).click();
    expect(onChange).toHaveBeenCalledExactlyOnceWith([
      expect.objectContaining({ key: "", value: "" }),
    ]);
  });

  it("edits and removes a row", async () => {
    const onChange = vi.fn();
    const row = { id: "1", key: "X-Token", value: "abc" };
    const screen = await render(
      <KeyValueField
        id="headers"
        label="Header"
        value={[row]}
        isDisabled={false}
        onChange={onChange}
      />,
    );
    await screen.getByRole("textbox", { name: "Header value 1" }).fill("xyz");
    expect(onChange).toHaveBeenLastCalledWith([{ ...row, value: "xyz" }]);
    await screen.getByRole("button", { name: "Remove header 1" }).click();
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
