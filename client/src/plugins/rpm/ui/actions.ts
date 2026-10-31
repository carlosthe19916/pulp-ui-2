import { advancedCopyAction, scanAction } from "@app/utils/entityFieldPresets";
import type { IActionUi } from "@plugin-sdk/ui";

/** The RPM repository's actions. */
export const rpmActions = {
  copy: advancedCopyAction({
    description:
      "Copies content and its dependencies between repositories as described by a config.",
  }),
  comps: {
    label: "Upload comps.xml",
    fields: [
      { key: "file", label: "comps.xml", type: "file", required: true },
      {
        key: "replace",
        label: "Replace existing comps content",
        type: "boolean",
      },
    ],
  },
  prune: {
    label: "Prune packages",
    description: "Removes all but the newest version of each package.",
    fields: [
      {
        key: "keep_days",
        label: "Keep days",
        type: "number",
        defaultValue: 14,
        helpText: "Prune packages introduced before this many days ago.",
      },
      { key: "dry_run", label: "Dry run", type: "boolean" },
    ],
  },
  scan: scanAction,
} satisfies Record<string, IActionUi>;
