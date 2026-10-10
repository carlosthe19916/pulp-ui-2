import type React from "react";

import { Label } from "@patternfly/react-core";

import { type EntityType, getPlugin } from "@catalog";

interface IPulpTypeLabelProps {
  kind: EntityType;
  pulpType: string;
}

/** Render a pulp_type as a compact PF Label, using the plugin label when available. */
export const PulpTypeLabel: React.FC<IPulpTypeLabelProps> = ({
  kind,
  pulpType,
}) => {
  const plugin = getPlugin(kind, pulpType);

  return (
    <Label color={plugin ? "blue" : "grey"} isCompact>
      {plugin?.ui.label ?? pulpType}
    </Label>
  );
};
