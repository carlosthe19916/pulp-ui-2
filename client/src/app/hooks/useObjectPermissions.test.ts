import { describe, expect, it } from "vitest";

import { permissionFor } from "./useObjectPermissions";

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
