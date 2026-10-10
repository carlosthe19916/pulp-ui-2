import { describe, expect, it } from "vitest";

import type { VersionResponse } from "@app/client";

import { buildCatalog } from "./compose";
import { catalog, definePlugin, getPlugin } from "./index";

/** Locks the resolved catalog so it can't silently drift. */
describe("catalog composition", () => {
  it("restores the entity base into every plugin (create: required; edit: optional)", () => {
    const file = catalog.remote["file.file"];
    const keys = file.form.createFields.map((f) => f.key);
    expect(keys).toContain("name");
    expect(keys).toContain("url");
    expect(keys).toContain("policy");
    // 19 base remote fields + 0 file extras.
    expect(file.form.createFields).toHaveLength(19);
    expect(file.form.createFields.find((f) => f.key === "name")?.required).toBe(
      true,
    );
    expect(
      file.form.editFields.find((f) => f.key === "name")?.required,
    ).toBeUndefined();
  });

  it("appends plugin extras after the base", () => {
    const rpm = catalog.remote["rpm.rpm"];
    const keys = rpm.form.createFields.map((f) => f.key);
    expect(keys[0]).toBe("name");
    expect(keys).toContain("sles_auth_token");
    expect(rpm.form.isWizard).toBe(true);
  });

  it("composes detail = entity base + plugin extras", () => {
    const fileRepo = catalog.repository["file.file"];
    expect(fileRepo.page.detailFields.map((f) => f.key)).toEqual([
      "description",
      "retain_repo_versions",
      "autopublish",
      "manifest",
    ]);
  });

  it("inherits entity capability defaults and applies overrides", () => {
    expect(catalog.repository["file.file"].capabilities).toEqual({
      creatable: true,
      sync: { remoteTypes: ["file.file", "file.git"] },
      publish: true,
      upload: false,
    });
    expect(catalog.repository["container.container"].capabilities.publish).toBe(
      false,
    );
    expect(catalog.repository["container.container-push"].capabilities).toEqual(
      {
        creatable: false,
        sync: false,
        publish: false,
        upload: false,
      },
    );
    expect(catalog.repository["maven.maven"].capabilities).toEqual({
      creatable: true,
      sync: false,
      publish: false,
      upload: false,
    });
    expect(catalog.content["file.file"].capabilities.upload).toBe(true);
  });

  it("carries each repository's valid sync remote types (backend REMOTE_TYPES)", () => {
    // rpm and file both accept a second remote variant (ULN, Git).
    expect(catalog.repository["rpm.rpm"].capabilities.sync).toEqual({
      remoteTypes: ["rpm.rpm", "rpm.uln"],
    });
    expect(catalog.repository["file.file"].capabilities.sync).toEqual({
      remoteTypes: ["file.file", "file.git"],
    });
    expect(catalog.repository["python.python"].capabilities.sync).toEqual({
      remoteTypes: ["python.python"],
    });
    // A container repo syncs only from container.container — NOT its pull-through
    // remote variant, which the backend's REMOTE_TYPES excludes.
    expect(catalog.repository["container.container"].capabilities.sync).toEqual(
      {
        remoteTypes: ["container.container"],
      },
    );
    // Non-syncable types carry `sync: false`, so there are no orphan remote types.
    expect(catalog.repository["maven.maven"].capabilities.sync).toBe(false);
  });

  it("carries the ui + app concerns, with per-variant ui overrides", () => {
    expect(catalog.remote["rpm.uln"].ui.label).toBe("ULN");
    expect(catalog.distribution["python.pypi"].ui.label).toBe("Python (PyPI)");
    const installed = [{ component: "file" }] as VersionResponse[];
    expect(catalog.remote["file.file"].app.isAvailable(installed)).toBe(true);
  });

  it("hoists plugin-level concerns to every entity it implements", () => {
    // Fully-invariant plugin: one ui/app declared once reaches all four slots.
    const slots = [
      catalog.repository["gem.gem"],
      catalog.remote["gem.gem"],
      catalog.distribution["gem.gem"],
      catalog.publication["gem.gem"],
    ];
    for (const slot of slots) {
      expect(slot.ui.label).toBe("Gem");
      expect(slot.app).toBe(catalog.repository["gem.gem"].app);
    }
    // rpm's default rest reaches repo/dist/pub; only the uln variant overrides it.
    expect(catalog.distribution["rpm.rpm"].rest.apiPath).toBe("rpm/rpm");
    expect(catalog.remote["rpm.uln"].rest.apiPath).toBe("rpm/uln");
    // file content overrides only apiPath; pulpType stays the plugin default.
    expect(catalog.content["file.file"].rest.apiPath).toBe("file/files");
  });

  it("covers every entity type and all pulp_types", () => {
    const counts = Object.fromEntries(
      Object.entries(catalog).map(([k, v]) => [k, Object.keys(v).length]),
    );
    expect(counts).toEqual({
      repository: 9,
      remote: 11,
      distribution: 9,
      publication: 5,
      content: 1,
    });
  });
});

describe("definePlugin defaults", () => {
  it("defaults isWizard to false and capabilities to creatable-only", () => {
    const testPlugin = definePlugin({
      app: { isAvailable: () => true },
      ui: { label: "Test" },
      rest: { pulpType: "test.test", apiPath: "test/test" },
      entities: { repository: {} },
    });
    const repo = testPlugin.repository?.[0];
    expect(repo?.form.isWizard).toBe(false);
    expect(repo?.capabilities).toEqual({
      creatable: true,
      sync: false,
      publish: false,
      upload: false,
    });
    // ui/rest fall back to the plugin-level defaults.
    expect(repo?.ui.label).toBe("Test");
    expect(repo?.rest.apiPath).toBe("test/test");
  });
});

describe("buildCatalog", () => {
  it("throws on a duplicate (entity, pulp_type)", () => {
    const makeRemote = () =>
      definePlugin({
        app: { isAvailable: () => true },
        ui: { label: "Dup" },
        rest: { pulpType: "dup.dup", apiPath: "dup/dup" },
        entities: { remote: {} },
      });
    expect(() => buildCatalog([makeRemote(), makeRemote()])).toThrow(
      /Duplicate catalog entry/,
    );
  });

  it("returns a deeply-frozen, read-only catalog", () => {
    expect(Object.isFrozen(catalog)).toBe(true);
    expect(Object.isFrozen(catalog.remote)).toBe(true);
    expect(Object.isFrozen(catalog.remote["file.file"])).toBe(true);
    expect(Object.isFrozen(catalog.remote["file.file"].form.createFields)).toBe(
      true,
    );
    expect(() => {
      (catalog.remote as Record<string, unknown>)["x.x"] = {};
    }).toThrow();
  });
});

describe("getPlugin", () => {
  it("returns the plugin for a known pulp_type", () => {
    expect(getPlugin("remote", "file.file")?.ui.label).toBe("File");
  });

  it("returns undefined for an unknown pulp_type", () => {
    expect(getPlugin("remote", "nope.nope")).toBeUndefined();
  });
});
