import { describe, expect, it } from "vitest";

import {
  ENTITY_TYPES,
  getContentType,
  getPulpType,
  PLUGIN_DEFINITIONS,
} from "@catalog";
import type { IPluginDefinition } from "@plugin-sdk/definition";
import {
  getContentGuardTypes,
  getEntityForm,
  getRepositoryActions,
  getRepositoryBrowse,
  getUploadFields,
} from "@plugins";

const definitions: readonly IPluginDefinition[] = PLUGIN_DEFINITIONS;

/** Conformance: what every plugin module must hold, checked over the real plugins. */
describe.each(definitions.map((definition) => [definition.id, definition]))(
  "plugin %s",
  (_id, definition) => {
    it("has a form for every type, opening with its essentials", () => {
      for (const entity of ENTITY_TYPES) {
        for (const pulpType of Object.keys(definition[entity] ?? {})) {
          const entry =
            getEntityForm({ entity, pulpType, mode: "edit" }) ??
            getEntityForm({ entity, pulpType, mode: "create" });
          expect(entry, `${entity} ${pulpType}`).toBeDefined();
          const sections = entry?.form.sections ?? [];
          expect(sections[0]?.variant, `${entity} ${pulpType}`).toBe(
            "essentials",
          );
          const ids = sections.map((section) => section.id);
          expect(new Set(ids).size, `${entity} ${pulpType}`).toBe(ids.length);
        }
      }
    });

    it("runs every declared action", () => {
      for (const [pulpType, repository] of Object.entries(
        definition.repository ?? {},
      )) {
        expect(
          getRepositoryActions(pulpType).map((action) => action.key),
        ).toEqual(Object.keys(repository.actions ?? {}));
      }
    });

    it("browses only content types that have a list endpoint", () => {
      for (const pulpType of Object.keys(definition.repository ?? {})) {
        for (const section of getRepositoryBrowse(pulpType)?.sections ?? []) {
          for (const contentType of section.pulpTypes) {
            expect(
              getContentType(contentType)?.apiPath,
              contentType,
            ).toBeTruthy();
          }
        }
      }
    });
  },
);

describe("plugin registry", () => {
  it("offers every declared content guard type with its UI", () => {
    const declared = definitions.flatMap((definition) =>
      Object.keys(definition.contentGuard ?? {}),
    );
    expect(getContentGuardTypes().map((type) => type.pulpType)).toEqual(
      declared,
    );
    expect(
      getContentGuardTypes().find((type) => type.pulpType === "certguard.x509"),
    ).toMatchObject({ pluginId: "certguard", rolesManaged: false });
    expect(
      getContentGuardTypes().find((type) => type.pulpType === "core.rbac"),
    ).toMatchObject({ rolesManaged: true, downloaderRole: true });
  });

  it("scans the versions of repositories that declare a scan action", () => {
    expect(getPulpType("rpm.rpm")?.entities.repository?.scan).toBe(true);
    expect(getPulpType("file.file")?.entities.repository?.scan).toBe(false);
  });

  it("creates publications but never edits them", () => {
    expect(
      getEntityForm({
        entity: "publication",
        pulpType: "file.file",
        mode: "create",
      }),
    ).toBeDefined();
    expect(
      getEntityForm({
        entity: "publication",
        pulpType: "file.file",
        mode: "edit",
      }),
    ).toBeUndefined();
  });

  it("edits push repositories but can't create them", () => {
    const pulpType = "container.container-push";
    expect(
      getEntityForm({ entity: "repository", pulpType, mode: "edit" }),
    ).toBeDefined();
    expect(
      getEntityForm({ entity: "repository", pulpType, mode: "create" }),
    ).toBeUndefined();
  });

  it("fills a collection endpoint's repository parameter", () => {
    expect(
      getRepositoryActions("rpm.rpm").find((action) => action.key === "prune")
        ?.repositoryParam,
    ).toEqual({ key: "repo_hrefs", list: true });
  });

  it("asks for a relative path when uploading a Maven artifact", () => {
    expect(getUploadFields("maven.artifact").map((field) => field.key)).toEqual(
      ["relative_path"],
    );
  });

  it("models deb's per-entity pulp_types", () => {
    expect(getPulpType("deb.deb")?.entities.repository).toBeDefined();
    expect(getPulpType("deb.apt-remote")?.entities.remote).toBeDefined();
    expect(
      getPulpType("deb.apt-distribution")?.entities.distribution,
    ).toBeDefined();
    expect(
      getPulpType("deb.verbatim-publication")?.entities.publication,
    ).toBeDefined();
  });

  it("imports archives into OSTree repositories", () => {
    expect(
      getPulpType("ostree.ostree")?.entities.repository?.archiveImport,
    ).toBe(true);
  });
});
