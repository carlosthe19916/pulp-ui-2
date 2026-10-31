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
      scan: true,
      actions: {
        prune: {
          path: "/widget/prune/",
          target: "repository",
          repositoryParam: { key: "repo_hrefs", list: true },
        },
      },
    },
    "widget.push": {
      apiPath: "container/container-push",
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
    const plugin = catalog.getPlugin("widget.widget");
    expect(plugin?.pluginId).toBe("widget");
    expect(Object.keys(plugin?.entities ?? {}).sort()).toEqual([
      "publication",
      "remote",
      "repository",
    ]);
    expect(plugin?.entities.repository).toMatchObject({
      compatibleRemoteTypes: ["widget.widget", "widget.git"],
      contentChanges: "modify",
      archiveImport: false,
      scan: true,
      contentTypes: ["widget.unit", "widget.part"],
    });
    expect(catalog.getPlugin("bogus.bogus")).toBeUndefined();
  });

  it("lists a repository type's actions by key", () => {
    expect(
      catalog.getPlugin("widget.widget")?.entities.repository?.actions,
    ).toEqual([
      {
        key: "prune",
        path: "/widget/prune/",
        target: "repository",
        repositoryParam: { key: "repo_hrefs", list: true },
      },
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
        .getAvailablePlugins({
          entity: "remote",
          installed: installed("gadget"),
        })
        .map((plugin) => plugin.pulpType),
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
    expect(catalog.getContentType("widget.unit")?.uploadable).toEqual({
      mechanism: "upload",
    });
    expect(catalog.getContentType("widget.part")?.uploadable).toBeUndefined();
    // A repository that can't change its content doesn't take new content.
    expect(catalog.getRepositoryTypesForContent("widget.unit")).toEqual([
      "widget.widget",
    ]);
    expect(catalog.getRepositoryTypesForPublication("widget.widget")).toEqual([
      "widget.widget",
    ]);
    expect(catalog.getScannableRepositoryTypes()).toEqual(["widget.widget"]);
    expect(catalog.getAcsSources()).toEqual([
      {
        pluginId: "widget",
        apiPath: "widget/widget",
        remoteType: "widget.widget",
      },
    ]);
  });

  it("refuses a type declared twice", () => {
    const twin = { ...gadget, id: "twin" } as IPluginDefinition;
    expect(() => createCatalog([gadget, twin])).toThrow(
      'Duplicate remote type "gadget.gadget".',
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
  });
});
