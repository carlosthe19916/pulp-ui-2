import { advancedCopyAction } from "@app/utils/entityFieldPresets";
import type { IActionUi } from "@plugin-sdk/ui";

/** The APT repository's actions. */
export const debActions = {
  copy: advancedCopyAction({
    description:
      "Copies content between repositories as described by a config.",
  }),
} satisfies Record<string, IActionUi>;
