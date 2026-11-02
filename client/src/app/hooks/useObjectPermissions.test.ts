import type {
  QueryObserverBaseResult,
  UseQueryResult,
} from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import {
  useMyPermissionsQueries,
  useMyPermissionsQuery,
} from "@app/queries/access";
import { useIsSuperuserQuery } from "@app/queries/users";
import type { DrfAxiosError } from "@app/queries/utils/openapiErrorTypes";

import {
  hasPermission,
  permissionFor,
  useObjectPermissions,
  useObjectsPermissions,
} from "./useObjectPermissions";

vi.mock(import("@app/queries/access"), () => ({
  useMyPermissionsQuery: vi.fn(),
  useMyPermissionsQueries: vi.fn(),
}));
vi.mock(import("@app/queries/users"), () => ({
  useIsSuperuserQuery: vi.fn(),
}));

/** A query result with just the fields the hook reads (the one cast, kept here). */
const queryResult = <T>(
  fields: Partial<QueryObserverBaseResult<T, DrfAxiosError>>,
) => fields as UseQueryResult<T, DrfAxiosError>;

const superuserStatus = (fields: { data?: boolean; isPending: boolean }) =>
  vi.mocked(useIsSuperuserQuery).mockReturnValue(queryResult(fields));

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

describe("permission reads", () => {
  const href = "/pulp/api/v3/repositories/file/file/1/";

  it("skips my_permissions/ for a superuser and allows everything", async () => {
    superuserStatus({ data: true, isPending: false });
    vi.mocked(useMyPermissionsQueries).mockReturnValue(new Map());
    const { result } = await renderHook(() =>
      useObjectsPermissions({ hrefs: [href] }),
    );
    expect(useMyPermissionsQueries).toHaveBeenLastCalledWith({
      hrefs: [href],
      enabled: false,
    });
    expect(result.current.can({ href, verb: "delete" })).toBe(true);
  });

  it("waits for the superuser check before reading my_permissions/", async () => {
    superuserStatus({ isPending: true });
    vi.mocked(useMyPermissionsQuery).mockReturnValue(queryResult({}));
    await renderHook(() => useObjectPermissions({ href }));
    expect(useMyPermissionsQuery).toHaveBeenLastCalledWith({
      href,
      enabled: false,
    });
  });

  it("reads my_permissions/ for a non-superuser", async () => {
    superuserStatus({ data: false, isPending: false });
    vi.mocked(useMyPermissionsQuery).mockReturnValue(
      queryResult({ data: { permissions: ["file.view_filerepository"] } }),
    );
    const { result } = await renderHook(() => useObjectPermissions({ href }));
    expect(useMyPermissionsQuery).toHaveBeenLastCalledWith({
      href,
      enabled: true,
    });
    expect(result.current.can("delete")).toBe(false);
  });

  it("still reads my_permissions/ when the superuser check fails", async () => {
    superuserStatus({ isPending: false });
    vi.mocked(useMyPermissionsQuery).mockReturnValue(
      queryResult({ data: { permissions: ["file.view_filerepository"] } }),
    );
    const { result } = await renderHook(() => useObjectPermissions({ href }));
    expect(useMyPermissionsQuery).toHaveBeenLastCalledWith({
      href,
      enabled: true,
    });
    expect(result.current.can("delete")).toBe(false);
  });
});
