import type React from "react";

import { Label } from "@patternfly/react-core";

import type { ResourceKind } from "@app/descriptors/types";
import { getDescriptor } from "@app/descriptors/registry";

interface IPulpTypeLabelProps {
  kind: ResourceKind;
  pulpType: string;
}

/** Render a pulp_type as a compact PF Label, using the descriptor label when available. */
export const PulpTypeLabel: React.FC<IPulpTypeLabelProps> = ({
  kind,
  pulpType,
}) => {
  const descriptor = getDescriptor(kind, pulpType);

  return (
    <Label color={descriptor ? "blue" : "grey"} isCompact>
      {descriptor?.label ?? pulpType}
    </Label>
  );
};
