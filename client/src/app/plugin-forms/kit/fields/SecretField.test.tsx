import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { SecretField } from "./SecretField";

const renderField = async ({
  mode,
  isSet,
  secretMode = "keep",
}: {
  mode: "create" | "edit";
  isSet: boolean;
  secretMode?: "keep" | "replace" | "clear";
}) => {
  const onChange = vi.fn();
  const screen = await render(
    <SecretField
      id="password"
      label="Password"
      mode={mode}
      value={{ mode: secretMode, value: "", isSet }}
      onChange={onChange}
    />,
  );
  return { screen, onChange };
};

describe("SecretField", () => {
  it("is a password input on create", async () => {
    const { screen, onChange } = await renderField({
      mode: "create",
      isSet: false,
      secretMode: "replace",
    });
    await screen.getByLabelText("Show Password").click();
    await screen.getByRole("textbox").fill("x");
    expect(onChange).toHaveBeenLastCalledWith({
      mode: "replace",
      value: "x",
      isSet: false,
    });
  });

  it("shows a set secret without its value and offers Change and Clear", async () => {
    const { screen, onChange } = await renderField({
      mode: "edit",
      isSet: true,
    });
    await expect
      .element(screen.getByText("Set", { exact: true }))
      .toBeVisible();
    await screen.getByRole("button", { name: "Clear Password" }).click();
    expect(onChange).toHaveBeenLastCalledWith({
      mode: "clear",
      value: "",
      isSet: true,
    });
    await screen.getByRole("button", { name: "Change Password" }).click();
    expect(onChange).toHaveBeenLastCalledWith({
      mode: "replace",
      value: "",
      isSet: true,
    });
  });

  it("offers Set, not Clear, for an unset secret", async () => {
    const { screen } = await renderField({ mode: "edit", isSet: false });
    await expect.element(screen.getByText("Not set")).toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Set Password" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Clear Password" }))
      .not.toBeInTheDocument();
  });

  it("undoes a pending clear", async () => {
    const { screen, onChange } = await renderField({
      mode: "edit",
      isSet: true,
      secretMode: "clear",
    });
    await expect.element(screen.getByText("Cleared on save")).toBeVisible();
    await screen.getByRole("button", { name: "Undo" }).click();
    expect(onChange).toHaveBeenLastCalledWith({
      mode: "keep",
      value: "",
      isSet: true,
    });
  });
});
