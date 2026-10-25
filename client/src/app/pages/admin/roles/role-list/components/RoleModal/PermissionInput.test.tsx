import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it, vi } from "vitest";

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
  it("renders each permission as a removable label", () => {
    const html = renderToStaticMarkup(
      <PermissionInput
        id="perms"
        value={["core.view_task", "core.change_task"]}
        onChange={vi.fn()}
      />,
    );
    expect(html).toContain("core.view_task");
    expect(html).toContain('aria-label="Remove core.change_task"');
    expect(html).toContain('aria-label="Add permission"');
  });
});
