import type React from "react";

import { Label } from "@patternfly/react-core";

import { getContentType, getPlugin } from "@catalog";

interface IPulpTypeLabelProps {
  pulpType: string;
}

/**
 * Render a pulp_type as a compact PF Label showing the raw type. Blue when the type
 * is known to the catalog (a CRUD plugin or a modelled content type), grey otherwise.
 */
export const PulpTypeLabel: React.FC<IPulpTypeLabelProps> = ({ pulpType }) => {
  const known = getContentType(pulpType) ?? getPlugin(pulpType);

  return (
    <Label color={known ? "blue" : "grey"} isCompact>
      {pulpType}
    </Label>
  );
};
