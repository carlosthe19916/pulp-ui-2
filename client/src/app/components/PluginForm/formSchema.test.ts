import { describe, expect, it } from "vitest";

import type { IEntityField } from "@catalog";

import {
  buildDefaultValues,
  buildFieldSchema,
  cleanFormValues,
  fieldsToBody,
} from "./formSchema";

const fields: IEntityField[] = [
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
    type: "asyncResource",
    resourceKind: "remote",
  },
];

describe("formSchema helpers", () => {
  it("builds defaults from entity fields", () => {
    expect(buildDefaultValues({ fields })).toEqual({
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

describe("fieldsToBody", () => {
  const fields: IEntityField[] = [
    { key: "tags", label: "Tags", type: "stringList" },
    { key: "config", label: "Config", type: "json" },
    { key: "units", label: "Units", type: "content", pulpTypes: ["file.file"] },
    {
      key: "repos",
      label: "Repositories",
      type: "asyncResource",
      resourceKind: "repository",
      multiple: true,
    },
  ];

  it("turns lines, JSON and picked content into request values", () => {
    expect(
      fieldsToBody({
        fields,
        values: {
          tags: " latest \n\nv1\n",
          config: '{"a": 1}',
          units: [{ href: "/c/1/", label: "one" }],
          repos: ["/r/1/"],
        },
      }),
    ).toEqual({
      tags: ["latest", "v1"],
      config: { a: 1 },
      units: ["/c/1/"],
      repos: ["/r/1/"],
    });
  });

  it("drops empty lists and blank text", () => {
    expect(
      fieldsToBody({
        fields,
        values: { tags: "\n", config: "", units: [], repos: [] },
      }),
    ).toEqual({});
  });
});

describe("buildDefaultValues for list fields", () => {
  it("shows a record's lists as lines and JSON as text", () => {
    expect(
      buildDefaultValues({
        fields: [
          { key: "paths", label: "Paths", type: "stringList" },
          { key: "mapping", label: "Mapping", type: "json" },
          { key: "units", label: "Units", type: "content", pulpTypes: [] },
        ],
        source: { paths: ["a/", "b/"], mapping: { x: "y" } },
      }),
    ).toEqual({
      paths: "a/\nb/",
      mapping: JSON.stringify({ x: "y" }, null, 2),
      units: [],
    });
  });
});
