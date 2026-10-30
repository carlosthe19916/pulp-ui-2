import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import type { IBatchResult } from "@app/queries/utils/settleBatch";
import type { ILabelChanges } from "@app/utils/pulpLabels";

import { EditablePulpLabels } from "./EditablePulpLabels";

vi.mock(import("@app/components/EditLabelsModal"), () => ({
  EditLabelsModal: ({
    onSave,
  }: {
    onSave: (changes: ILabelChanges) => Promise<IBatchResult>;
  }) => (
    <button
      type="button"
      onClick={() =>
        void onSave({ toSet: [{ key: "a", value: "b" }], toUnset: [] })
      }
    >
      stub-save
    </button>
  ),
}));

const NO_PERMISSION = {
  isAriaDisabled: true,
  tooltipProps: { content: "You don't have permission to change this." },
};

const noop = vi.fn().mockResolvedValue({ succeeded: [], failed: [] });

describe("EditablePulpLabels", () => {
  it("shows labels and an enabled Edit labels control when editable", async () => {
    const screen = await render(
      <EditablePulpLabels
        labels={{ env: "prod" }}
        isSaving={false}
        onSave={noop}
      />,
    );

    await expect.element(screen.getByText("env=prod")).toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Edit labels" }))
      .toBeEnabled();
  });

  it("forwards the modal's save to onSave", async () => {
    const onSave = vi.fn().mockResolvedValue({ succeeded: [], failed: [] });
    const screen = await render(
      <EditablePulpLabels
        labels={{ env: "prod" }}
        isSaving={false}
        onSave={onSave}
      />,
    );

    await screen.getByRole("button", { name: "Edit labels" }).click();
    await screen.getByRole("button", { name: "stub-save" }).click();

    expect(onSave).toHaveBeenCalledWith({
      toSet: [{ key: "a", value: "b" }],
      toUnset: [],
    });
  });

  it("keeps Edit labels visible but disabled, with the reason, when read-only", async () => {
    const screen = await render(
      <EditablePulpLabels
        labels={{ env: "prod" }}
        actionProps={NO_PERMISSION}
        isSaving={false}
        onSave={noop}
      />,
    );
    const edit = screen.getByRole("button", { name: "Edit labels" });

    await expect.element(edit).toHaveAttribute("aria-disabled", "true");
    // The disabled label drops pointer events; its wrapper takes the hover.
    await userEvent.hover(edit.element().parentElement!);
    await expect
      .element(screen.getByText("You don't have permission to change this."))
      .toBeVisible();
  });
});
