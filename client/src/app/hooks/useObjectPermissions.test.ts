import { describe, expect, it } from "vitest";

import { hasPermission, permissionFor } from "./useObjectPermissions";

describe("permissionFor", () => {
  const permissions = [
    "file.view_filerepository",
    "file.change_filerepository",
  ];

  it("derives the app and model from the view permission", () => {
    expect(permissionFor({ permissions, verb: "sync" })).toBe(
      "file.sync_filerepository",
    );
    expect(permissionFor({ permissions, verb: "manage_roles" })).toBe(
      "file.manage_roles_filerepository",
    );
  });

  it("names a repository's version delete permission", () => {
    expect(permissionFor({ permissions, verb: "delete_version" })).toBe(
      "file.delete_filerepository_version",
    );
  });

  it("is undefined without a view permission", () => {
    expect(permissionFor({ permissions: [], verb: "delete" })).toBeUndefined();
  });
});

describe("hasPermission", () => {
  it("grants a verb whose permission is held", () => {
    const permissions = [
      "file.view_filerepository",
      "file.sync_filerepository",
    ];
    expect(hasPermission({ permissions, verb: "sync" })).toBe(true);
    expect(hasPermission({ permissions, verb: "delete" })).toBe(false);
  });

  it("accepts each plugin's name for modifying content", () => {
    expect(
      hasPermission({
        permissions: [
          "rpm.view_rpmrepository",
          "rpm.modify_content_rpmrepository",
        ],
        verb: "modify",
      }),
    ).toBe(true);
    expect(
      hasPermission({
        permissions: [
          "ansible.view_ansiblerepository",
          "ansible.modify_ansible_repo_content",
        ],
        verb: "modify",
      }),
    ).toBe(true);
    expect(
      hasPermission({
        permissions: ["rpm.view_rpmrepository"],
        verb: "modify",
      }),
    ).toBe(false);
  });
});
