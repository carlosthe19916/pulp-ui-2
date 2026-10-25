import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { PermissionInput } from "./PermissionInput";
import { addPermission } from "./permissionList";

describe("addPermission", () => {
  it("adds a trimmed codename and keeps the list sorted", () => {
    expect(
      addPermission({
        permissions: ["file.view_filerepository"],
        draft: "  core.view_task ",
      }),
    ).toEqual(["core.view_task", "file.view_filerepository"]);
  });

  it("returns the same list for a blank or duplicate codename", () => {
    const permissions = ["core.view_task"];
    expect(addPermission({ permissions, draft: "   " })).toBe(permissions);
    expect(addPermission({ permissions, draft: "core.view_task" })).toBe(
      permissions,
    );
  });
});

describe("PermissionInput", () => {
  it("renders each permission as a removable label", async () => {
    const screen = await render(
      <PermissionInput
        id="perms"
        value={["core.view_task", "core.change_task"]}
        onChange={vi.fn()}
      />,
    );
    await expect.element(screen.getByText("core.view_task")).toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Remove core.change_task" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("textbox", { name: "Add permission" }))
      .toBeVisible();
  });

  it("adds the typed permission on Enter", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <PermissionInput id="perms" value={[]} onChange={onChange} />,
    );

    await screen.getByRole("textbox", { name: "Add permission" }).click();
    await userEvent.keyboard("core.view_task{Enter}");

    expect(onChange).toHaveBeenCalledExactlyOnceWith(["core.view_task"]);
  });

  it("removes a permission when its label is closed", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <PermissionInput
        id="perms"
        value={["core.view_task", "core.change_task"]}
        onChange={onChange}
      />,
    );

    await screen.getByRole("button", { name: "Remove core.view_task" }).click();

    expect(onChange).toHaveBeenCalledExactlyOnceWith(["core.change_task"]);
  });
});
