import { describe, expect, it } from "vitest";

import type { VersionResponse } from "@app/client";

import { createCatalog } from "./createCatalog";
import type { IPluginDefinition } from "./types";

const widget = {
  id: "widget",
  packages: ["widget", "pulp-widget"],
  remote: {
    "widget.widget": { apiPath: "file/file" },
    "widget.git": { apiPath: "file/git" },
  },
  repository: {
    "widget.widget": {
      apiPath: "file/file",
      compatibleRemoteTypes: ["widget.widget", "widget.git"],
      compatiblePublicationTypes: ["widget.widget"],
      contentChanges: "modify",
      actions: {
        prune: {
          path: "/widget/prune/",
          target: "repository",
          repositoryParam: { key: "repo_hrefs", list: true },
        },
        scan: { path: "scan/", target: "version" },
      },
    },
    "widget.push": {
      apiPath: "container/container-push",
      rolesManaged: false,
      compatibleRemoteTypes: [],
      compatiblePublicationTypes: [],
      contentChanges: null,
    },
  },
  publication: { "widget.widget": { apiPath: "file/file" } },
  content: {
    "widget.unit": { apiPath: "file/files", upload: "upload" },
    "widget.part": {},
  },
  acs: { apiPath: "widget/widget", remoteType: "widget.widget" },
} as unknown as IPluginDefinition;

const gadget = {
  id: "gadget",
  packages: ["gadget"],
  remote: { "gadget.gadget": { apiPath: "gem/gem" } },
  content: { "gadget.unit": { apiPath: "gem/gem" } },
} as unknown as IPluginDefinition;

const installed = (...components: string[]) =>
  components.map((component) => ({ component }) as VersionResponse);

describe("createCatalog", () => {
  const catalog = createCatalog([widget, gadget]);

  it("groups what every entity offers under its pulp_type", () => {
    const typeInfo = catalog.getPulpType("widget.widget");
    expect(typeInfo?.pluginId).toBe("widget");
    expect(Object.keys(typeInfo?.entities ?? {}).sort()).toEqual([
      "publication",
      "remote",
      "repository",
    ]);
    expect(typeInfo?.entities.repository).toMatchObject({
      compatibleRemoteTypes: ["widget.widget", "widget.git"],
      contentChanges: "modify",
      archiveImport: false,
      scan: true,
      rolesManaged: true,
      contentTypes: ["widget.unit", "widget.part"],
    });
    expect(
      catalog.getPulpType("widget.push")?.entities.repository,
    ).toMatchObject({ scan: false, rolesManaged: false });
    expect(catalog.getPulpType("bogus.bogus")).toBeUndefined();
  });

  it("lists a repository type's actions by key", () => {
    expect(
      catalog.getPulpType("widget.widget")?.entities.repository?.actions,
    ).toEqual([
      {
        key: "prune",
        path: "/widget/prune/",
        target: "repository",
        repositoryParam: { key: "repo_hrefs", list: true },
      },
      { key: "scan", path: "scan/", target: "version" },
    ]);
  });

  it("resolves pulp_types from apiPaths, per entity", () => {
    expect(
      catalog.resolvePulpTypeByApiPath({
        entity: "remote",
        apiPath: "file/git",
      }),
    ).toBe("widget.git");
    expect(
      catalog.resolvePulpTypeByApiPath({
        entity: "distribution",
        apiPath: "file/file",
      }),
    ).toBeUndefined();
    expect(catalog.resolveContentTypeByApiPath({ apiPath: "file/files" })).toBe(
      "widget.unit",
    );
  });

  it("offers only types whose plugin is installed", () => {
    expect(
      catalog
        .getAvailableTypes({
          entity: "remote",
          installed: installed("gadget"),
        })
        .map((typeInfo) => typeInfo.pulpType),
    ).toEqual(["gadget.gadget"]);
    expect(
      catalog
        .getContentTypes({ installed: installed("widget") })
        .map((content) => content.pulpType),
    ).toEqual(["widget.unit", "widget.part"]);
    expect(
      catalog.isPluginInstalled({
        pluginId: "widget",
        installed: installed("x"),
      }),
    ).toBe(false);
  });

  it("answers the content and capability questions pages ask", () => {
    expect(catalog.getContentType("widget.unit")?.upload).toBe("upload");
    expect(catalog.getContentType("widget.part")?.upload).toBeUndefined();
    // A repository that can't change its content doesn't take new content.
    expect(catalog.getRepositoryTypesForContent("widget.unit")).toEqual([
      "widget.widget",
    ]);
    expect(catalog.getRepositoryTypesForPublication("widget.widget")).toEqual([
      "widget.widget",
    ]);
    expect(catalog.getScannableRepositoryTypes()).toEqual(["widget.widget"]);
    expect(
      catalog.getScannableRepositoryTypes({ installed: installed("gadget") }),
    ).toEqual([]);
    expect(catalog.getAcsFacts()).toEqual([
      {
        pluginId: "widget",
        apiPath: "widget/widget",
        remoteType: "widget.widget",
      },
    ]);
  });

  it("resolves content guard types from their apiPaths", () => {
    const guards = createCatalog([
      {
        id: "guards",
        packages: [],
        contentGuard: {
          "guards.open": { apiPath: "core/rbac", downloaderRole: true },
          "guards.cert": { apiPath: "certguard/x509", rolesManaged: false },
        },
      } as unknown as IPluginDefinition,
    ]);
    expect(
      guards.resolveContentGuardTypeByApiPath({ apiPath: "core/rbac" }),
    ).toMatchObject({
      pulpType: "guards.open",
      rolesManaged: true,
      downloaderRole: true,
    });
    expect(
      guards.resolveContentGuardTypeByApiPath({ apiPath: "certguard/x509" }),
    ).toMatchObject({
      pulpType: "guards.cert",
      rolesManaged: false,
      downloaderRole: false,
    });
    expect(
      guards.resolveContentGuardTypeByApiPath({ apiPath: "x/y" }),
    ).toBeUndefined();
  });

  it("refuses a type declared twice", () => {
    const twin = { ...gadget, id: "twin" } as IPluginDefinition;
    expect(() => createCatalog([gadget, twin])).toThrow(
      '"gadget.gadget" is declared by both "gadget" and "twin".',
    );
    const content = {
      id: "content",
      packages: [],
      content: { "gadget.unit": {} },
    } as unknown as IPluginDefinition;
    expect(() => createCatalog([gadget, content])).toThrow(
      'Duplicate content type "gadget.unit".',
    );
    const path = {
      id: "path",
      packages: [],
      content: { "path.unit": { apiPath: "gem/gem" } },
    } as unknown as IPluginDefinition;
    expect(() => createCatalog([gadget, path])).toThrow(
      'Duplicate content apiPath "gem/gem".',
    );
    const sameEndpoint = {
      id: "same",
      packages: [],
      remote: { "same.remote": { apiPath: "gem/gem" } },
    } as unknown as IPluginDefinition;
    expect(() => createCatalog([gadget, sameEndpoint])).toThrow(
      'Duplicate remote apiPath "gem/gem".',
    );
  });
});
