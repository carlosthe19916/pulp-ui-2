import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { IBatchResult } from "@app/queries/utils/settleBatch";

import { EditLabelsModal } from "./EditLabelsModal";

const ok: IBatchResult = { succeeded: ["x"], failed: [] };

const renderModal = ({
  labels,
  onSave = vi.fn().mockResolvedValue(ok),
  onClose = vi.fn(),
}: {
  labels?: Record<string, string | null>;
  onSave?: () => Promise<IBatchResult>;
  onClose?: () => void;
}) =>
  render(
    <EditLabelsModal
      labels={labels}
      isSaving={false}
      onSave={onSave}
      onClose={onClose}
    />,
  );

describe("EditLabelsModal", () => {
  it("adds a typed label and saves it as a set change", async () => {
    const onSave = vi.fn().mockResolvedValue(ok);
    const screen = await renderModal({ labels: {}, onSave });

    await screen.getByRole("textbox", { name: "Add label" }).fill("team=a");
    await screen.getByRole("button", { name: "Add" }).click();
    await expect.element(screen.getByText("team=a")).toBeVisible();

    await screen.getByRole("button", { name: "Save" }).click();

    expect(onSave).toHaveBeenCalledWith({
      toSet: [{ key: "team", value: "a" }],
      toUnset: [],
    });
  });

  it("removes an existing label and saves it as an unset change", async () => {
    const onSave = vi.fn().mockResolvedValue(ok);
    const screen = await renderModal({ labels: { env: "prod" }, onSave });

    await screen.getByRole("button", { name: "Remove label env" }).click();
    await screen.getByRole("button", { name: "Save" }).click();

    expect(onSave).toHaveBeenCalledWith({ toSet: [], toUnset: ["env"] });
  });

  it("closes on a fully successful save", async () => {
    const onClose = vi.fn();
    const screen = await renderModal({ labels: { env: "prod" }, onClose });

    await screen.getByRole("button", { name: "Remove label env" }).click();
    await screen.getByRole("button", { name: "Save" }).click();

    await expect.poll(() => onClose.mock.calls.length).toBe(1);
  });

  it("stays open when the save reports a failure", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue({
      succeeded: [],
      failed: [{ label: "env", error: new Error("nope") }],
    } satisfies IBatchResult);
    const screen = await renderModal({
      labels: { env: "prod" },
      onClose,
      onSave,
    });

    await screen.getByRole("button", { name: "Remove label env" }).click();
    await screen.getByRole("button", { name: "Save" }).click();

    await expect.poll(() => onSave.mock.calls.length).toBe(1);
    // Let the awaited result settle, then confirm the modal did not close.
    await Promise.resolve();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("rejects an invalid key and does not add a chip", async () => {
    const screen = await renderModal({ labels: {} });

    await screen.getByRole("textbox", { name: "Add label" }).fill("bad key");
    await screen.getByRole("button", { name: "Add" }).click();

    await expect.element(screen.getByText(/Key may use letters/)).toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Save" }))
      .toBeDisabled();
  });

  it("disables Save until the label set changes", async () => {
    const screen = await renderModal({ labels: { env: "prod" } });

    await expect
      .element(screen.getByRole("button", { name: "Save" }))
      .toBeDisabled();
  });
});
