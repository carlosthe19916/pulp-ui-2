/** How the AI assistant's chat is shown: overlay, docked over the page, or in a drawer beside it. */
export const ASSISTANT_DISPLAY_MODES = ["default", "docked", "drawer"] as const;

export type AssistantDisplayMode = (typeof ASSISTANT_DISPLAY_MODES)[number];

export const isAssistantDisplayMode = (
  value: unknown,
): value is AssistantDisplayMode =>
  (ASSISTANT_DISPLAY_MODES as readonly unknown[]).includes(value);
