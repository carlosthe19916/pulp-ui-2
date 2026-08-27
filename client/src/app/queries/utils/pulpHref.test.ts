import { describe, expect, it } from "vitest";

import {
  buildContentHref,
  buildDistributionContentUrl,
  buildDistributionHref,
  buildGroupHref,
  buildPublicationHref,
  buildRemoteHref,
  buildRepositoryHref,
  buildRoleHref,
  buildUserHref,
  extractIdFromHref,
  inferPulpTypeFromHref,
  isEmptyDetailPayload,
  resolvePulpType,
} from "./pulpHref";

describe("pulpHref helpers", () => {
  const enabled = { enabled: true, name: "default" };
  const disabled = { enabled: false, name: "default" };

  it("builds domain-scoped hrefs with the domain segment when enabled", () => {
    expect(buildUserHref("42", enabled)).toBe(
      "/api/pulp/default/api/v3/users/42/",
    );
    expect(buildGroupHref("7", enabled)).toBe(
      "/api/pulp/default/api/v3/groups/7/",
    );
    expect(buildRoleHref("abc", enabled)).toBe(
      "/api/pulp/default/api/v3/roles/abc/",
    );
  });

  it("omits the domain segment when the domain is disabled", () => {
    expect(buildUserHref("42", disabled)).toBe("/api/pulp/api/v3/users/42/");
    expect(buildRepositoryHref("r1", disabled)).toBe(
      "/api/pulp/api/v3/repositories/file/file/r1/",
    );
  });

  it("builds file-typed resource hrefs", () => {
    expect(buildRepositoryHref("r1", enabled)).toContain(
      "/repositories/file/file/r1/",
    );
    expect(buildRemoteHref("rm1", enabled)).toContain(
      "/remotes/file/file/rm1/",
    );
    expect(buildDistributionHref("d1", enabled)).toContain(
      "/distributions/file/file/d1/",
    );
    expect(buildPublicationHref("p1", enabled)).toContain(
      "/publications/file/file/p1/",
    );
    expect(buildContentHref("c1", enabled)).toContain(
      "/content/file/files/c1/",
    );
  });

  it("extracts the trailing id from a pulp_href", () => {
    expect(extractIdFromHref("/api/pulp/default/api/v3/users/42/")).toBe("42");
  });

  it("infers pulp_type from typed resource hrefs", () => {
    expect(
      inferPulpTypeFromHref(
        "/api/pulp/default/api/v3/repositories/file/file/abc/",
      ),
    ).toBe("file.file");
    expect(
      inferPulpTypeFromHref("/api/pulp/default/api/v3/content/file/files/abc/"),
    ).toBe("file.file");
    expect(resolvePulpType("rpm.rpm", "/repositories/file/file/x/")).toBe(
      "rpm.rpm",
    );
    expect(resolvePulpType(undefined, "/remotes/file/file/x/")).toBe(
      "file.file",
    );
  });

  it("detects empty detail payloads", () => {
    expect(isEmptyDetailPayload(undefined)).toBe(true);
    expect(isEmptyDetailPayload({})).toBe(true);
    expect(isEmptyDetailPayload({ name: "x" })).toBe(false);
  });

  it("joins distribution base_url and relative_path for downloads", () => {
    expect(
      buildDistributionContentUrl(
        "http://pulp.example/pulp/content/files/",
        "docs/readme.txt",
      ),
    ).toBe("http://pulp.example/pulp/content/files/docs/readme.txt");
    expect(
      buildDistributionContentUrl(
        "http://pulp.example/pulp/content/files",
        "/docs/readme.txt",
      ),
    ).toBe("http://pulp.example/pulp/content/files/docs/readme.txt");
  });
});
