import type { IActionUi } from "@plugin-sdk/ui";

/** The Maven repository's actions. */
export const mavenActions = {
  "repair-metadata": {
    label: "Repair metadata",
    description: "Regenerates every maven-metadata.xml file and its checksums.",
    fields: [],
  },
  "repair-packages": {
    label: "Repair packages",
    description:
      "Reconciles the latest version's packages with the POMs it holds.",
    fields: [],
  },
  "repair-index-pages": {
    label: "Repair index pages",
    description: "Regenerates the HTML index page of every directory.",
    fields: [],
  },
  "build-path-index": {
    label: "Build path index",
    description: "Builds the initial path index.",
    fields: [],
  },
  "compact-path-index": {
    label: "Compact path index",
    description: "Rebases the latest completed path index.",
    fields: [],
  },
} satisfies Record<string, IActionUi>;
