import type React from "react";

import { Label } from "@patternfly/react-core";

import { getPlugin } from "@catalog";

interface IPulpTypeLabelProps {
  pulpType: string;
}

/** Render a pulp_type as a compact PF Label, using the plugin label when available. */
export const PulpTypeLabel: React.FC<IPulpTypeLabelProps> = ({ pulpType }) => {
  const plugin = getPlugin(pulpType);

  return (
    <Label color={plugin ? "blue" : "grey"} isCompact>
      {plugin?.label ?? pulpType}
    </Label>
  );
};
