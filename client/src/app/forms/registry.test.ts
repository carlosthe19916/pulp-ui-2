import { describe, expect, it } from "vitest";

import type { VersionResponse } from "@app/client";
import { type EntityType, getAvailablePlugins, getPlugin } from "@catalog";

import { formFields } from "./kit/derive/visibility";
import { getEntityForm, registeredEntries } from "./registry";

const entries = registeredEntries();

// Every plugin installed, so every catalog type is listed.
const ALL_INSTALLED = [
  "ansible",
  "container",
  "core",
  "deb",
  "file",
  "gem",
  "maven",
  "npm",
  "ostree",
  "python",
  "rpm",
  "hugging_face",
].map((component) => ({ component, version: "1.0.0" }) as VersionResponse);

/** Entities whose every catalog type has a form; grows as each entity moves to pages. */
const COMPLETE_ENTITIES: EntityType[] = ["remote"];

describe("form registry", () => {
  it.each(
    COMPLETE_ENTITIES.flatMap((entity) =>
      getAvailablePlugins({ entity, installed: ALL_INSTALLED }).map(
        (plugin) => ({ entity, pulpType: plugin.pulpType }),
      ),
    ),
  )("$entity $pulpType has an edit form", ({ entity, pulpType }) => {
    expect(getEntityForm({ entity, pulpType, mode: "edit" })).toBeDefined();
  });

  it.each(entries)(
    "$entity $pulpType is a catalog type",
    ({ entity, pulpType }) => {
      expect(getPlugin(pulpType)?.entities[entity]).toBeDefined();
    },
  );

  it.each(entries)(
    "$entity $pulpType starts with essentials and has unique sections and keys",
    ({ entity, pulpType }) => {
      const entry =
        getEntityForm({ entity, pulpType, mode: "edit" }) ??
        getEntityForm({ entity, pulpType, mode: "create" });
      if (!entry) throw new Error("registered without a mode");
      const { form } = entry;
      expect(form.sections[0]?.variant).toBe("essentials");
      const ids = form.sections.map((section) => section.id);
      expect(new Set(ids).size).toBe(ids.length);
      const keys = formFields(form).map((field) => field.key);
      expect(new Set(keys).size).toBe(keys.length);
    },
  );
});
