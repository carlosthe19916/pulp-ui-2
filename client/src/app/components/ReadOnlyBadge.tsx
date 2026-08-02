import type React from "react";

import { Label, Tooltip } from "@patternfly/react-core";

interface ReadOnlyBadgeProps {
  pulpType?: string;
}

export const ReadOnlyBadge: React.FC<ReadOnlyBadgeProps> = ({ pulpType }) => {
  const tooltipContent = pulpType
    ? `No descriptor available for plugin type "${pulpType}"`
    : "No descriptor available for this plugin type";

  return (
    <Tooltip content={tooltipContent}>
      <Label color="grey" isCompact>
        Read-only
      </Label>
    </Tooltip>
  );
};
