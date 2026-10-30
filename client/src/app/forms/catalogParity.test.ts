import { describe, expect, it } from "vitest";

import { getPlugin } from "@catalog";

import { formFields } from "./kit/derive/visibility";
import { getEntityForm, registeredEntries } from "./registry";

/**
 * Temporary, until the catalog drops its form fields: no field the old modal offered is lost
 * by a type's new form. A deliberate drop is listed here with its reason.
 */
const DROPPED: Record<string, string[]> = {
  // These policy enums allow a single value, the server default.
  "remote:ansible.collection": ["policy"],
  "remote:ansible.role": ["policy"],
  "remote:maven.maven": ["policy"],
  "remote:container.pull-through": ["policy"],
};

const entries = registeredEntries();

describe("catalog parity", () => {
  it.each(entries)(
    "$entity $pulpType keeps every catalog form field",
    ({ entity, pulpType }) => {
      const slot = getPlugin(pulpType)?.entities[entity];
      const catalogKeys = new Set(
        [...(slot?.form.createFields ?? []), ...(slot?.form.editFields ?? [])]
          .filter((field) => field.type !== "content")
          .map((field) => field.key),
      );
      const entry =
        getEntityForm({ entity, pulpType, mode: "create" }) ??
        getEntityForm({ entity, pulpType, mode: "edit" });
      const formKeys = new Set(
        entry ? formFields(entry.form).map((field) => field.key) : [],
      );
      const dropped = DROPPED[`${entity}:${pulpType}`] ?? [];
      const missing = [...catalogKeys].filter(
        (key) => !formKeys.has(key) && !dropped.includes(key),
      );
      expect(missing).toEqual([]);
    },
  );
});
