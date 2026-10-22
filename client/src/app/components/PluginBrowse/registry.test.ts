import { describe, expect, it } from "vitest";

import { getContentType } from "@catalog";

import { getPluginBrowse, visibleSections } from "./registry";

const summary = (present: Record<string, number>) => ({
  added: {},
  removed: {},
  present: Object.fromEntries(
    Object.entries(present).map(([type, count]) => [type, { count, href: "" }]),
  ),
});

describe("Browse registry", () => {
  it("shows only sections whose content is present, with summed counts", () => {
    const rpm = getPluginBrowse("rpm.rpm")!;
    const visible = visibleSections({
      sections: rpm.sections,
      summary: summary({ "rpm.package": 12, "rpm.advisory": 3 }),
    });
    expect(visible.map(({ section, count }) => [section.key, count])).toEqual([
      ["packages", 12],
      ["advisories", 3],
    ]);
  });

  it("sums every content type a section covers", () => {
    const maven = getPluginBrowse("maven.maven")!;
    const [artifacts] = visibleSections({
      sections: maven.sections,
      summary: summary({ "maven.package": 3, "maven.artifact": 6 }),
    });
    expect(artifacts.count).toBe(9);
  });

  it("has no Browse view for unknown repository types", () => {
    expect(getPluginBrowse("bogus.bogus")).toBeUndefined();
  });

  it("only lists content types the catalog can query", () => {
    for (const type of [
      "ansible.ansible",
      "container.container",
      "rpm.rpm",
      "deb.deb",
      "python.python",
      "file.file",
      "maven.maven",
      "npm.npm",
      "gem.gem",
      "ostree.ostree",
      "hugging_face.hugging-face",
    ]) {
      for (const section of getPluginBrowse(type)!.sections) {
        for (const pulpType of section.pulpTypes) {
          expect(getContentType(pulpType)?.apiPath, pulpType).toBeTruthy();
        }
      }
    }
  });
});
