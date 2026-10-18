import type React from "react";

import { Label } from "@patternfly/react-core";
import type { LabelProps } from "@patternfly/react-core";

const STATE_COLORS: Record<string, NonNullable<LabelProps["color"]>> = {
  completed: "green",
  running: "blue",
  failed: "red",
  canceled: "orange",
  canceling: "orange",
  waiting: "teal",
  skipped: "grey",
};

/** Pulp task state rendered as a color-coded PatternFly Label. */
export const TaskStateLabel: React.FC<{
  state?: string | null;
  isCompact?: boolean;
}> = ({ state, isCompact }) => (
  <Label color={STATE_COLORS[state ?? ""] ?? "grey"} isCompact={isCompact}>
    {state}
  </Label>
);
