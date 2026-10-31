import { describe, expect, it } from "vitest";
import type { ValidationError } from "yup";

import { testForm } from "../testForm";
import type { FormMode, FormValues } from "../types";
import { buildDefaultValues } from "./defaults";
import { buildFormSchema } from "./schema";

const errorsOf = async ({
  mode,
  values,
}: {
  mode: FormMode;
  values: FormValues;
}): Promise<Record<string, string>> => {
  const schema = buildFormSchema({ form: testForm, ctx: { mode, values } });
  try {
    await schema.validate(values, { abortEarly: false });
    return {};
  } catch (error) {
    return Object.fromEntries(
      (error as ValidationError).inner.map((inner) => [
        inner.path ?? "",
        inner.message,
      ]),
    );
  }
};

const valid = (mode: FormMode): FormValues => ({
  ...buildDefaultValues({ form: testForm, mode }),
  name: "a",
  url: "https://a.example.com/",
  password:
    mode === "create"
      ? { mode: "replace", value: "x", isSet: false }
      : { mode: "keep", value: "", isSet: true },
});

describe("buildFormSchema", () => {
  it("accepts valid values", async () => {
    expect(await errorsOf({ mode: "create", values: valid("create") })).toEqual(
      {},
    );
  });

  it("requires the required fields", async () => {
    const errors = await errorsOf({
      mode: "create",
      values: buildDefaultValues({ form: testForm, mode: "create" }),
    });
    expect(errors).toMatchObject({
      name: "Name is required",
      url: "URL is required",
      password: "Password is required",
    });
  });

  it("requires a create-only-required secret on create, not on edit", async () => {
    const values = {
      ...valid("edit"),
      password: { mode: "keep", value: "", isSet: false },
    };
    expect(await errorsOf({ mode: "edit", values })).toEqual({});
  });

  it("rejects an invalid URL and a non-PEM certificate", async () => {
    const errors = await errorsOf({
      mode: "create",
      values: { ...valid("create"), url: "not a url", ca_cert: "hello" },
    });
    expect(errors.url).toBe("URL must be a valid URL");
    expect(errors.ca_cert).toMatch(/must be PEM-encoded/);
  });

  it("rejects invalid YAML only while the field is visible", async () => {
    const yaml = "collections: [unclosed";
    const shown = await errorsOf({
      mode: "create",
      values: {
        ...valid("create"),
        policy: "immediate",
        requirements_file: yaml,
      },
    });
    expect(shown.requirements_file).toBe("Requirements must be valid YAML");
    const hidden = await errorsOf({
      mode: "create",
      values: {
        ...valid("create"),
        policy: "on_demand",
        requirements_file: yaml,
      },
    });
    expect(hidden).toEqual({});
  });
});
