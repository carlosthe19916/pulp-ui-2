import type React from "react";

import { Label, Tooltip } from "@patternfly/react-core";

interface ReadOnlyBadgeProps {
  pulpType?: string;
  /** Optional override explaining why this resource is read-only. */
  reason?: string;
}

export const ReadOnlyBadge: React.FC<ReadOnlyBadgeProps> = ({
  pulpType,
  reason,
}) => {
  const tooltipContent =
    reason ??
    (pulpType
      ? `Actions aren't supported for plugin type "${pulpType}" in the UI yet.`
      : "This resource type isn't supported for actions in the UI yet.");

  return (
    <Tooltip content={tooltipContent}>
      <Label color="grey" isCompact>
        Read-only
      </Label>
    </Tooltip>
  );
};
