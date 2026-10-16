import { describe, expect, it } from "vitest";

import type { VersionResponse } from "@app/client";

import { buildCatalog } from "./compose";
import {
  getAvailablePlugins,
  getPlugin,
  resolvePulpTypeByApiPath,
} from "./index";
import type { IPluginDefinition } from "./types";

/** Locks the resolved catalog so it can't silently drift. */
describe("catalog composition", () => {
  it("restores the entity base into every plugin (create: required; edit: optional)", () => {
    const remote = getPlugin("file.file")?.entities.remote;
    const keys = remote?.form.createFields.map((f) => f.key);
    expect(keys).toContain("name");
    expect(keys).toContain("url");
    expect(keys).toContain("policy");
    // 19 base remote fields + 0 file extras.
    expect(remote?.form.createFields).toHaveLength(19);
    expect(
      remote?.form.createFields.find((f) => f.key === "name")?.required,
    ).toBe(true);
    expect(
      remote?.form.editFields.find((f) => f.key === "name")?.required,
    ).toBeUndefined();
  });

  it("appends plugin extras after the base", () => {
    const remote = getPlugin("rpm.rpm")?.entities.remote;
    const keys = remote?.form.createFields.map((f) => f.key);
    expect(keys?.[0]).toBe("name");
    expect(keys).toContain("sles_auth_token");
    expect(remote?.form.isWizard).toBe(true);
  });

  it("carries each repository's valid sync remote types (backend REMOTE_TYPES)", () => {
    // rpm and file both accept a second remote variant (ULN, Git).
    expect(
      getPlugin("rpm.rpm")?.entities.repository?.compatibleRemoteTypes,
    ).toEqual(["rpm.rpm", "rpm.uln"]);
    expect(
      getPlugin("file.file")?.entities.repository?.compatibleRemoteTypes,
    ).toEqual(["file.file", "file.git"]);
    expect(
      getPlugin("python.python")?.entities.repository?.compatibleRemoteTypes,
    ).toEqual(["python.python"]);
    // A container repo syncs only from container.container — NOT its pull-through
    // remote variant, which the backend's REMOTE_TYPES excludes.
    expect(
      getPlugin("container.container")?.entities.repository
        ?.compatibleRemoteTypes,
    ).toEqual(["container.container"]);
    // Non-syncable types carry an empty list, so there are no orphan remote types.
    expect(
      getPlugin("maven.maven")?.entities.repository?.compatibleRemoteTypes,
    ).toEqual([]);
    expect(
      getPlugin("container.container-push")?.entities.repository
        ?.compatibleRemoteTypes,
    ).toEqual([]);
  });

  it("carries each repository's publication type (plugins with a publication endpoint)", () => {
    // 1:1 per plugin; note python repo publishes to the python.pypi type.
    expect(
      getPlugin("file.file")?.entities.repository?.compatiblePublicationTypes,
    ).toEqual(["file.file"]);
    expect(
      getPlugin("python.python")?.entities.repository
        ?.compatiblePublicationTypes,
    ).toEqual(["python.pypi"]);
    expect(
      getPlugin("rpm.rpm")?.entities.repository?.compatiblePublicationTypes,
    ).toEqual(["rpm.rpm"]);
    // Non-publishable types carry an empty list.
    expect(
      getPlugin("npm.npm")?.entities.repository?.compatiblePublicationTypes,
    ).toEqual([]);
    expect(
      getPlugin("maven.maven")?.entities.repository?.compatiblePublicationTypes,
    ).toEqual([]);
    expect(
      getPlugin("container.container")?.entities.repository
        ?.compatiblePublicationTypes,
    ).toEqual([]);
  });

  it("resolves variants to their own pulp_type with per-variant ui labels", () => {
    expect(getPlugin("rpm.uln")?.label).toBe("ULN");
    expect(getPlugin("rpm.uln")?.entities.remote).toBeDefined();
    expect(getPlugin("file.git")?.label).toBe("File (Git)");
    expect(getPlugin("python.pypi")?.entities.distribution).toBeDefined();
    expect(getPlugin("python.pypi")?.label).toBe("Python (PyPI)");
  });

  it("hoists plugin-level concerns to every entity it implements", () => {
    // Fully-invariant plugin: one ui/app declared once reaches all four slots.
    const gem = getPlugin("gem.gem");
    expect(gem?.label).toBe("Gem");
    for (const entity of [
      "repository",
      "remote",
      "distribution",
      "publication",
    ] as const) {
      expect(gem?.entities[entity]).toBeDefined();
    }
    const installed = [{ component: "gem" }] as VersionResponse[];
    expect(gem?.isAvailable(installed)).toBe(true);
    // rest.apiPath is per entity: default reaches repo/dist/pub; only variants override.
    expect(getPlugin("rpm.rpm")?.entities.distribution?.apiPath).toBe(
      "rpm/rpm",
    );
    expect(getPlugin("rpm.uln")?.entities.remote?.apiPath).toBe("rpm/uln");
    // file content overrides only apiPath; pulpType stays the plugin default.
    expect(getPlugin("file.file")?.entities.content?.apiPath).toBe(
      "file/files",
    );
  });
});

describe("getPlugin", () => {
  it("returns a plugin with every entity it implements", () => {
    const file = getPlugin("file.file");
    expect(file?.pulpType).toBe("file.file");
    expect(file?.label).toBe("File");
    expect(Object.keys(file?.entities ?? {}).sort()).toEqual([
      "content",
      "distribution",
      "publication",
      "remote",
      "repository",
    ]);
  });

  it("returns undefined for an unknown pulp_type", () => {
    expect(getPlugin("nope.nope")).toBeUndefined();
  });
});

describe("getAvailablePlugins", () => {
  it("lists plugins implementing an entity whose package is installed", () => {
    const installed = [{ component: "file" }] as VersionResponse[];
    const remotes = getAvailablePlugins({ entity: "remote", installed });
    const pulpTypes = remotes.map((p) => p.pulpType);
    // Only the file plugin is installed → file.file + file.git remotes; no rpm.
    expect(pulpTypes).toContain("file.file");
    expect(pulpTypes).toContain("file.git");
    expect(pulpTypes).not.toContain("rpm.rpm");
    // Nothing installed → nothing available.
    expect(
      getAvailablePlugins({ entity: "remote", installed: [] }),
    ).toHaveLength(0);
  });
});

describe("resolvePulpTypeByApiPath", () => {
  it("reverse-maps (entity, apiPath) to the catalog pulp_type", () => {
    expect(
      resolvePulpTypeByApiPath({
        entity: "repository",
        apiPath: "python/python",
      }),
    ).toBe("python.python");
    // apiPath ≠ pulp_type (content pluralizes the slug).
    expect(
      resolvePulpTypeByApiPath({ entity: "content", apiPath: "file/files" }),
    ).toBe("file.file");
    // Non-"doubled" distribution slug.
    expect(
      resolvePulpTypeByApiPath({
        entity: "distribution",
        apiPath: "python/pypi",
      }),
    ).toBe("python.pypi");
  });

  it("returns undefined for an unmodelled apiPath", () => {
    expect(
      resolvePulpTypeByApiPath({
        entity: "repository",
        apiPath: "bogus/bogus",
      }),
    ).toBeUndefined();
  });
});

describe("buildCatalog", () => {
  const makeRemote = (): IPluginDefinition => ({
    app: { isAvailable: () => true },
    ui: { label: "Dup" },
    rest: { pulpType: "dup.dup", apiPath: "dup/dup" },
    entities: {
      remote: {
        form: { isWizard: false, createFields: [], editFields: [] },
      },
    },
  });

  it("throws on a duplicate (entity, pulp_type)", () => {
    expect(() => buildCatalog([makeRemote(), makeRemote()])).toThrow(
      /Duplicate catalog entry/,
    );
  });

  it("returns a deeply-frozen, read-only catalog", () => {
    const catalog = buildCatalog([makeRemote()]);
    expect(Object.isFrozen(catalog)).toBe(true);
    expect(Object.isFrozen(catalog["dup.dup"])).toBe(true);
    expect(Object.isFrozen(catalog["dup.dup"].entities.remote)).toBe(true);
    expect(() => {
      (catalog as Record<string, unknown>)["x.x"] = {};
    }).toThrow();
  });

  it("hoists plugin ui/rest into a slot whose overrides are empty", () => {
    const catalog = buildCatalog([
      {
        app: { isAvailable: () => true },
        ui: { label: "Test" },
        rest: { pulpType: "test.test", apiPath: "test/test" },
        entities: {
          repository: {
            form: { isWizard: false, createFields: [], editFields: [] },
            compatibleRemoteTypes: [],
            compatiblePublicationTypes: [],
          },
        },
      },
    ]);
    const plugin = catalog["test.test"];
    expect(plugin.label).toBe("Test");
    expect(plugin.entities.repository?.apiPath).toBe("test/test");
    expect(plugin.entities.repository?.form.isWizard).toBe(false);
    expect(plugin.entities.repository?.compatibleRemoteTypes).toEqual([]);
  });
});
