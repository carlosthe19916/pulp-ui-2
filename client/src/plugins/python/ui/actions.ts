import { scanAction } from "@app/utils/entityFieldPresets";
import type { IActionUi } from "@plugin-sdk/ui";

/** The Python repository's actions. */
export const pythonActions = {
  "repair-metadata": {
    label: "Repair metadata",
    description:
      "Repairs the metadata of every package without creating a new version.",
    fields: [],
  },
  scan: scanAction,
} satisfies Record<string, IActionUi>;
