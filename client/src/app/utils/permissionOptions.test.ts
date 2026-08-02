import { collectPermissionOptions } from "./permissionOptions";

describe("collectPermissionOptions", () => {
  it("unions, dedupes, and sorts permissions including selected values", () => {
    expect(
      collectPermissionOptions(
        [
          ["core.view_task", "core.change_task"],
          ["core.view_task", "file.view_filecontent"],
          undefined,
          null,
        ],
        ["custom.permission", "core.change_task"],
      ),
    ).toEqual([
      "core.change_task",
      "core.view_task",
      "custom.permission",
      "file.view_filecontent",
    ]);
  });
});
