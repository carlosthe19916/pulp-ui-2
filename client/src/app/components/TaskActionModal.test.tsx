import type React from "react";
import { useState } from "react";

import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import type { IEntityField } from "@app/utils/entityField";

import { TaskActionModal } from "./TaskActionModal";

const FIELDS: Record<string, IEntityField[]> = {
  header: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "header_name", label: "Header name", type: "text" },
  ],
  redirect: [{ key: "name", label: "Name", type: "text", required: true }],
};

interface IHarnessProps {
  onSubmit: (body: Record<string, unknown>) => void;
}

const Harness: React.FC<IHarnessProps> = ({ onSubmit }) => {
  const [type, setType] = useState("header");
  return (
    <TaskActionModal
      title="Create guard"
      submitLabel="Create"
      formKey={type}
      fields={FIELDS[type]}
      beforeFields={
        <select
          aria-label="Type"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option value="header">Header</option>
          <option value="redirect">Redirect</option>
        </select>
      }
      isSubmitting={false}
      submitError={null}
      onSubmit={onSubmit}
      onClose={() => undefined}
    />
  );
};

describe("TaskActionModal", () => {
  it("swaps the fields on a new formKey without remounting the modal", async () => {
    const screen = await render(<Harness onSubmit={vi.fn()} />);
    const dialog = screen.getByRole("dialog").element();
    await screen
      .getByRole("textbox", { name: "Name", exact: true })
      .fill("guard-a");

    const select = screen.getByRole("combobox", { name: "Type" });
    (select.element() as HTMLSelectElement).focus();
    await userEvent.keyboard("{ArrowDown}");

    await expect.element(select).toHaveValue("redirect");
    expect(screen.getByRole("dialog").element()).toBe(dialog);
    await expect.element(select).toHaveFocus();
    await expect
      .element(screen.getByRole("textbox", { name: "Header name" }))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("textbox", { name: "Name", exact: true }))
      .toHaveValue("");
  });

  it("submits the current fields' values", async () => {
    const onSubmit = vi.fn();
    const screen = await render(<Harness onSubmit={onSubmit} />);
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Type" }),
      "redirect",
    );
    await screen
      .getByRole("textbox", { name: "Name", exact: true })
      .fill("guard-b");

    await screen.getByRole("button", { name: "Create" }).click();

    await vi.waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ name: "guard-b" }),
    );
  });
});
