import { describe, expect, it } from "vitest";

import {
  hrefAction,
  pulpApiPath,
  pulpCollectionPath,
  pulpHref,
  pulpRootApiPath,
  toProxyHref,
} from "./pulpApi";

const enabled = { enabled: true, name: "default" };
const disabled = { enabled: false, name: "default" };

describe("pulpApiPath", () => {
  it("accepts an endpoint with or without a leading slash", () => {
    expect(pulpApiPath("repositories/", disabled)).toBe(
      "/api/pulp/api/v3/repositories/",
    );
    expect(pulpApiPath("/repositories/", disabled)).toBe(
      "/api/pulp/api/v3/repositories/",
    );
  });

  it("inserts the domain segment when the domain is enabled", () => {
    expect(pulpApiPath("/repositories/", enabled)).toBe(
      "/api/pulp/default/api/v3/repositories/",
    );
  });

  it("preserves the trailing slash as-is", () => {
    expect(pulpApiPath("tasks/purge/", disabled)).toBe(
      "/api/pulp/api/v3/tasks/purge/",
    );
  });

  it("rejects endpoints the spec doesn't have", () => {
    // @ts-expect-error typo
    expect(pulpApiPath("repository/", disabled)).toBeTruthy();
    // @ts-expect-error missing trailing slash
    expect(pulpApiPath("repositories", disabled)).toBeTruthy();
    // @ts-expect-error outside any domain: use pulpRootApiPath
    expect(pulpApiPath("status/", disabled)).toBeTruthy();
  });
});

describe("pulpRootApiPath", () => {
  it("never adds a domain segment", () => {
    expect(pulpRootApiPath("status/")).toBe("/api/pulp/api/v3/status/");
  });

  it("rejects domain-scoped endpoints", () => {
    // @ts-expect-error domain-scoped: use pulpApiPath
    expect(pulpRootApiPath("tasks/")).toBeTruthy();
  });
});

describe("pulpCollectionPath", () => {
  it("builds a plugin collection path in both domain modes", () => {
    expect(
      pulpCollectionPath({
        collection: "remotes",
        apiPath: "rpm/rpm",
        domain: disabled,
      }),
    ).toBe("/api/pulp/api/v3/remotes/rpm/rpm/");
    expect(
      pulpCollectionPath({
        collection: "remotes",
        apiPath: "rpm/rpm",
        domain: enabled,
      }),
    ).toBe("/api/pulp/default/api/v3/remotes/rpm/rpm/");
  });

  it("appends an action under the collection", () => {
    expect(
      pulpCollectionPath({
        collection: "content",
        apiPath: "file/files",
        domain: disabled,
        action: "upload/",
      }),
    ).toBe("/api/pulp/api/v3/content/file/files/upload/");
  });

  it("rejects collections and actions the spec doesn't have", () => {
    expect(
      pulpCollectionPath({
        // @ts-expect-error not a plugin collection
        collection: "tasks",
        apiPath: "x/y",
        domain: disabled,
      }),
    ).toBeTruthy();
    expect(
      pulpCollectionPath({
        collection: "remotes",
        apiPath: "rpm/rpm",
        domain: disabled,
        // @ts-expect-error remotes have no upload
        action: "upload/",
      }),
    ).toBeTruthy();
  });
});

describe("hrefAction", () => {
  it("appends the action to the proxied href", () => {
    expect(
      hrefAction({
        kind: "repositories",
        href: "/pulp/api/v3/repositories/rpm/rpm/1/",
        action: "sync/",
      }),
    ).toBe("/api/pulp/api/v3/repositories/rpm/rpm/1/sync/");
  });

  it("rejects actions the resource kind doesn't take", () => {
    expect(
      // @ts-expect-error remotes don't sync
      hrefAction({ kind: "remotes", href: "/x/", action: "sync/" }),
    ).toBeTruthy();
  });
});

describe("pulpHref", () => {
  it("builds the server-form href under API_ROOT", () => {
    expect(
      pulpHref("repositories/file/file/abc/", { enabled: true, name: "d1" }),
    ).toBe("/pulp/d1/api/v3/repositories/file/file/abc/");
    expect(pulpHref("tasks/abc/", { enabled: false, name: "default" })).toBe(
      "/pulp/api/v3/tasks/abc/",
    );
  });

  it("proxies to the same URL the API path builders produce", () => {
    const domain = { enabled: true, name: "d1" };
    expect(toProxyHref(pulpHref("remotes/rpm/rpm/x/", domain))).toBe(
      `${pulpCollectionPath({ collection: "remotes", apiPath: "rpm/rpm", domain })}x/`,
    );
  });

  it("rejects hrefs outside a spec endpoint", () => {
    // @ts-expect-error typo in the collection
    expect(pulpHref("remote/rpm/rpm/x/", enabled)).toBeTruthy();
  });
});
