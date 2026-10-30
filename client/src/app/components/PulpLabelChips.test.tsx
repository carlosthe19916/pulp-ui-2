import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { PulpLabelChips } from "./PulpLabelChips";

describe("PulpLabelChips", () => {
  it("renders labels as key=value, and a bare key when valueless", async () => {
    const screen = await render(
      <PulpLabelChips labels={{ env: "prod", archived: null }} />,
    );

    await expect.element(screen.getByText("env=prod")).toBeVisible();
    await expect.element(screen.getByText("archived")).toBeVisible();
  });

  it("calls onLabelClick with the clicked label", async () => {
    const onLabelClick = vi.fn();
    const screen = await render(
      <PulpLabelChips labels={{ env: "prod" }} onLabelClick={onLabelClick} />,
    );

    await screen.getByText("env=prod").click();

    expect(onLabelClick).toHaveBeenCalledWith({ key: "env", value: "prod" });
  });

  it("renders a remove button that calls onRemove", async () => {
    const onRemove = vi.fn();
    const screen = await render(
      <PulpLabelChips labels={{ env: "prod" }} onRemove={onRemove} />,
    );

    await screen.getByRole("button", { name: "Remove label env" }).click();

    expect(onRemove).toHaveBeenCalledWith("env");
  });

  it("renders the addLabelControl", async () => {
    const screen = await render(
      <PulpLabelChips
        labels={{ env: "prod" }}
        addLabelControl={<span>add-control</span>}
      />,
    );

    await expect.element(screen.getByText("add-control")).toBeVisible();
  });
});
