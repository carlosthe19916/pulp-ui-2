import { describe, expect, it } from "vitest";

import { testForm } from "../testForm";
import { buildDefaultValues } from "./defaults";
import {
  initialExpandedSections,
  sectionSummary,
  sectionsWithErrors,
} from "./sectionState";

describe("initialExpandedSections", () => {
  it("opens only essentials on create", () => {
    const values = buildDefaultValues({ form: testForm, mode: "create" });
    expect([
      ...initialExpandedSections({
        form: testForm,
        ctx: { mode: "create", values },
      }),
    ]).toEqual(["essentials"]);
  });

  it("opens sections holding a set value on edit", () => {
    const entity = {
      name: "a",
      url: "https://a/",
      tls_validation: false,
      hidden_fields: [{ name: "password", is_set: true }],
    };
    const values = buildDefaultValues({ form: testForm, mode: "edit", entity });
    expect([
      ...initialExpandedSections({
        form: testForm,
        ctx: { mode: "edit", values, entity },
      }),
    ]).toEqual(["essentials", "auth", "tls"]);
  });
});

describe("sectionsWithErrors", () => {
  it("lists the sections holding an errored field", () => {
    expect(
      sectionsWithErrors({ form: testForm, errorKeys: ["name", "ca_cert"] }),
    ).toEqual(["essentials", "tls"]);
  });
});

describe("sectionSummary", () => {
  it("counts the set fields when the section has no summary of its own", () => {
    const values = {
      ...buildDefaultValues({ form: testForm, mode: "create" }),
      download_concurrency: "3",
      include_tags: ["latest"],
    };
    const network = testForm.sections.find(
      (section) => section.id === "network",
    );
    expect(
      network &&
        sectionSummary({ section: network, ctx: { mode: "create", values } }),
    ).toBe("2 set");
  });
});
