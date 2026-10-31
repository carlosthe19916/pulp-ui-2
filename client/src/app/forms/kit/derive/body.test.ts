import { describe, expect, it } from "vitest";

import { testForm } from "../testForm";
import { buildCreateBody, buildPatchBody } from "./body";
import { newKeyValueRow } from "./codecs";
import { buildDefaultValues } from "./defaults";

const createDefaults = () =>
  buildDefaultValues({ form: testForm, mode: "create" });

const entity = {
  name: "upstream",
  url: "https://example.com/",
  description: "Mirror",
  policy: "immediate",
  requirements_file: "collections: []",
  base_path: "upstream",
  tls_validation: true,
  ca_cert: "-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----",
  download_concurrency: 5,
  include_tags: ["latest"],
  headers: [{ "X-Token": "abc" }],
  pulp_labels: { env: "prod" },
  hidden_fields: [{ name: "password", is_set: true }],
};

const editDefaults = () =>
  buildDefaultValues({ form: testForm, mode: "edit", entity });

describe("buildCreateBody", () => {
  it("sends the visible, non-empty values", () => {
    const values = {
      ...createDefaults(),
      name: "upstream",
      url: "https://example.com/",
      password: { mode: "replace", value: "s3cret", isSet: false },
      download_concurrency: "4",
      include_tags: ["latest", "stable"],
      headers: [newKeyValueRow({ key: "X-Token", value: "abc" })],
      pulp_labels: [newKeyValueRow({ key: "env", value: "prod" })],
    };
    expect(buildCreateBody({ form: testForm, values })).toEqual({
      name: "upstream",
      url: "https://example.com/",
      tls_validation: true,
      password: "s3cret",
      download_concurrency: 4,
      include_tags: ["latest", "stable"],
      headers: [{ "X-Token": "abc" }],
      pulp_labels: { env: "prod" },
    });
  });

  it("drops fields hidden by a condition", () => {
    const values = {
      ...createDefaults(),
      name: "a",
      url: "https://a/",
      policy: "on_demand",
      requirements_file: "collections: []",
    };
    expect(buildCreateBody({ form: testForm, values })).not.toHaveProperty(
      "requirements_file",
    );
  });
});

describe("buildPatchBody", () => {
  it("sends nothing when nothing changed", () => {
    const initialValues = editDefaults();
    expect(
      buildPatchBody({
        form: testForm,
        values: initialValues,
        initialValues,
        entity,
      }),
    ).toEqual({});
  });

  it("sends only the changed fields", () => {
    const initialValues = editDefaults();
    const values = { ...initialValues, url: "https://mirror.example.com/" };
    expect(
      buildPatchBody({ form: testForm, values, initialValues, entity }),
    ).toEqual({ url: "https://mirror.example.com/" });
  });

  it("clears an emptied field with its clear value", () => {
    const initialValues = editDefaults();
    const values = {
      ...initialValues,
      description: "",
      ca_cert: "",
      download_concurrency: "",
      include_tags: [],
      headers: [],
    };
    expect(
      buildPatchBody({ form: testForm, values, initialValues, entity }),
    ).toEqual({
      description: null,
      ca_cert: null,
      download_concurrency: null,
      include_tags: null,
      headers: [],
    });
  });

  it("clears a set field that a condition now hides", () => {
    const initialValues = editDefaults();
    const values = { ...initialValues, policy: "on_demand" };
    expect(
      buildPatchBody({ form: testForm, values, initialValues, entity }),
    ).toEqual({ policy: "on_demand", requirements_file: null });
  });

  it("clears a set secret that a condition now hides", () => {
    const tokenEntity = {
      ...entity,
      policy: "on_demand",
      hidden_fields: [{ name: "token", is_set: true }],
    };
    const initialValues = buildDefaultValues({
      form: testForm,
      mode: "edit",
      entity: tokenEntity,
    });
    const values = { ...initialValues, policy: "immediate" };
    expect(
      buildPatchBody({
        form: testForm,
        values,
        initialValues,
        entity: tokenEntity,
      }),
    ).toEqual({ policy: "immediate", token: null });
  });

  it("never sends read-only or create-only fields", () => {
    const initialValues = editDefaults();
    const values = {
      ...initialValues,
      base_path: "changed",
      pulp_labels: [newKeyValueRow({ key: "env", value: "dev" })],
    };
    expect(
      buildPatchBody({ form: testForm, values, initialValues, entity }),
    ).toEqual({});
  });

  it("keeps an untouched secret, replaces a changed one and clears a cleared one", () => {
    const initialValues = editDefaults();
    expect(initialValues.password).toEqual({
      mode: "keep",
      value: "",
      isSet: true,
    });
    const patch = (password: unknown) =>
      buildPatchBody({
        form: testForm,
        values: { ...initialValues, password },
        initialValues,
        entity,
      });
    expect(patch({ mode: "replace", value: "new", isSet: true })).toEqual({
      password: "new",
    });
    expect(patch({ mode: "replace", value: "", isSet: true })).toEqual({});
    expect(patch({ mode: "clear", value: "", isSet: true })).toEqual({
      password: null,
    });
  });

  it("applies the form's body transform", () => {
    const initialValues = editDefaults();
    const form = {
      ...testForm,
      transformBody: (body: Record<string, unknown>) => ({
        ...body,
        extra: true,
      }),
    };
    expect(
      buildPatchBody({
        form,
        values: { ...initialValues, url: "https://b/" },
        initialValues,
        entity,
      }),
    ).toEqual({ url: "https://b/", extra: true });
  });
});
