import { describe, expect, it } from "vitest";

import {
  ENTITY_TYPES,
  getContentType,
  getPlugin,
  PLUGIN_DEFINITIONS,
} from "@catalog";
import type { IPluginDefinition } from "@plugin-sdk/definition";
import {
  getEntityForm,
  getRepositoryActions,
  getRepositoryBrowse,
  getUploadFields,
} from "@plugins";

import { registeredForms } from "./registry";

const definitions: readonly IPluginDefinition[] = PLUGIN_DEFINITIONS;

/** Conformance: what every plugin module must hold, checked over the real plugins. */
describe.each(definitions.map((definition) => [definition.id, definition]))(
  "plugin %s",
  (_id, definition) => {
    it("syncs from and publishes to types it declares", () => {
      for (const [pulpType, repository] of Object.entries(
        definition.repository ?? {},
      )) {
        for (const remote of repository.compatibleRemoteTypes) {
          expect(
            getPlugin(remote)?.entities.remote,
            `${pulpType} → ${remote}`,
          ).toBeDefined();
        }
        for (const publication of repository.compatiblePublicationTypes) {
          expect(
            getPlugin(publication)?.entities.publication,
            `${pulpType} → ${publication}`,
          ).toBeDefined();
        }
      }
    });

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

    it("names every repository action and gives it fields", () => {
      for (const [pulpType, repository] of Object.entries(
        definition.repository ?? {},
      )) {
        const actions = getRepositoryActions(pulpType);
        expect(actions.map((action) => action.key)).toEqual(
          Object.keys(repository.actions ?? {}),
        );
        for (const action of actions) {
          expect(action.label, `${pulpType} ${action.key}`).not.toBe(
            action.key,
          );
          expect(Array.isArray(action.fields)).toBe(true);
        }
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
  it("registers forms only for declared types", () => {
    for (const { entity, pulpType } of registeredForms()) {
      expect(
        getPlugin(pulpType)?.entities[entity],
        `${entity} ${pulpType}`,
      ).toBeDefined();
    }
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
    expect(getPlugin("deb.deb")?.entities.repository).toBeDefined();
    expect(getPlugin("deb.apt-remote")?.entities.remote).toBeDefined();
    expect(
      getPlugin("deb.apt-distribution")?.entities.distribution,
    ).toBeDefined();
    expect(
      getPlugin("deb.verbatim-publication")?.entities.publication,
    ).toBeDefined();
  });

  it("imports archives into OSTree repositories", () => {
    expect(getPlugin("ostree.ostree")?.entities.repository?.archiveImport).toBe(
      true,
    );
  });
});
