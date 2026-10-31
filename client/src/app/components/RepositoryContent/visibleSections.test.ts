import { describe, expect, it } from "vitest";

import type { IBrowseSection } from "@plugin-sdk/ui";

import { visibleSections } from "./visibleSections";

const View = () => null;

const sections: IBrowseSection[] = [
  { key: "packages", title: "Packages", pulpTypes: ["rpm.package"], View },
  { key: "advisories", title: "Advisories", pulpTypes: ["rpm.advisory"], View },
  { key: "modules", title: "Modules", pulpTypes: ["rpm.modulemd"], View },
  {
    key: "artifacts",
    title: "Artifacts",
    pulpTypes: ["maven.package", "maven.artifact"],
    View,
  },
];

const summary = (present: Record<string, number>) => ({
  added: {},
  removed: {},
  present: Object.fromEntries(
    Object.entries(present).map(([type, count]) => [type, { count, href: "" }]),
  ),
});

describe("visibleSections", () => {
  it("shows only sections whose content is present, with their counts", () => {
    const visible = visibleSections({
      sections: sections.slice(0, 3),
      summary: summary({ "rpm.package": 12, "rpm.advisory": 3 }),
    });
    expect(visible.map(({ section, count }) => [section.key, count])).toEqual([
      ["packages", 12],
      ["advisories", 3],
    ]);
  });

  it("sums every content type a section covers", () => {
    const [artifacts] = visibleSections({
      sections: sections.slice(3),
      summary: summary({ "maven.package": 3, "maven.artifact": 6 }),
    });
    expect(artifacts.count).toBe(9);
  });
});
