import { describe, expect, it } from "vitest";

import { getPlugin } from "@catalog";

import { formFields } from "./kit/derive/visibility";
import { getEntityForm, registeredEntries } from "./registry";

const entries = registeredEntries();

describe("form registry", () => {
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
