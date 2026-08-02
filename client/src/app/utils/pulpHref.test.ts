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
} from "./pulpHref";

describe("pulpHref helpers", () => {
  it("builds domain-scoped hrefs", () => {
    expect(buildUserHref("42")).toContain("/users/42/");
    expect(buildGroupHref("7")).toContain("/groups/7/");
    expect(buildRoleHref("abc")).toContain("/roles/abc/");
  });

  it("builds file-typed resource hrefs", () => {
    expect(buildRepositoryHref("r1")).toContain("/repositories/file/file/r1/");
    expect(buildRemoteHref("rm1")).toContain("/remotes/file/file/rm1/");
    expect(buildDistributionHref("d1")).toContain(
      "/distributions/file/file/d1/",
    );
    expect(buildPublicationHref("p1")).toContain("/publications/file/file/p1/");
    expect(buildContentHref("c1")).toContain("/content/file/files/c1/");
  });

  it("extracts the trailing id from a pulp_href", () => {
    expect(extractIdFromHref("/api/pulp/default/api/v3/users/42/")).toBe("42");
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
