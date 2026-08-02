import { describe, expect, it } from "vitest";

import {
  buildDefaultValues,
  buildFieldSchema,
  cleanFormValues,
} from "./formSchema";
import type { FieldDescriptor } from "./types";

const fields: FieldDescriptor[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "description", label: "Description", type: "textarea" },
  {
    key: "autopublish",
    label: "Auto-publish",
    type: "boolean",
    defaultValue: false,
  },
  {
    key: "remote",
    label: "Remote",
    type: "resource",
    resourceKind: "remote",
  },
];

describe("formSchema helpers", () => {
  it("builds defaults from field descriptors", () => {
    expect(buildDefaultValues(fields)).toEqual({
      name: "",
      description: "",
      autopublish: false,
      remote: "",
    });
  });

  it("requires name and accepts optional remote", async () => {
    const schema = buildFieldSchema(fields);
    await expect(schema.validate({ name: "repo" })).resolves.toMatchObject({
      name: "repo",
    });
    await expect(schema.validate({ name: "" })).rejects.toThrow(/Name/);
  });

  it("strips empty optional strings from cleaned values", () => {
    expect(
      cleanFormValues({
        name: "repo",
        description: "",
        autopublish: false,
        remote: null,
      }),
    ).toEqual({ name: "repo", autopublish: false });
  });
});
