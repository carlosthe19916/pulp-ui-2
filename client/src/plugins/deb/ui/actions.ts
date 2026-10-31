import { advancedCopyAction } from "@app/forms/fragments";
import type { IActionUi } from "@plugin-sdk/ui";

/** The APT repository's actions. */
export const debActions = {
  copy: advancedCopyAction({
    description:
      "Copies content between repositories as described by a config.",
  }),
} satisfies Record<string, IActionUi>;
