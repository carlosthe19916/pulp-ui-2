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
    { key: "value", label: "Value", type: "text" },
  ],
  redirect: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "value", label: "Value", type: "number" },
    { key: "enabled", label: "Enabled", type: "text", defaultValue: "yes" },
  ],
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

const nameBox = (screen: Awaited<ReturnType<typeof render>>) =>
  screen.getByRole("textbox", { name: "Name", exact: true });

describe("TaskActionModal", () => {
  it("swaps the fields on a new formKey without remounting the modal", async () => {
    const screen = await render(<Harness onSubmit={vi.fn()} />);
    const dialog = screen.getByRole("dialog").element();

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
      .element(screen.getByRole("textbox", { name: "Enabled" }))
      .toHaveValue("yes");
  });

  it("carries over values of fields both types share, by key and type", async () => {
    const onSubmit = vi.fn();
    const screen = await render(<Harness onSubmit={onSubmit} />);
    await nameBox(screen).fill("guard-a");
    await screen.getByRole("textbox", { name: "Header name" }).fill("X-Token");
    await screen.getByRole("textbox", { name: "Value" }).fill("secret");

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Type" }),
      "redirect",
    );

    await expect.element(nameBox(screen)).toHaveValue("guard-a");
    // `value` is text in one type and a number in the other: it starts over.
    await expect
      .element(screen.getByRole("spinbutton", { name: "Value" }))
      .toHaveValue(null);

    await screen.getByRole("button", { name: "Create" }).click();
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const body = onSubmit.mock.calls[0][0] as Record<string, unknown>;
    expect(body).toMatchObject({ name: "guard-a", enabled: "yes" });
    expect(body).not.toHaveProperty("header_name");
    expect(body.value).not.toBe("secret");
  });
});
