import type React from "react";
import { createElement } from "react";

import type { EntityType } from "@catalog";

import { Label, Tooltip } from "@patternfly/react-core";

import { getTypeIcon, getTypeLabel } from "@plugins";

interface IPulpTypeLabelProps {
  pulpType: string;
  /** The entity the type belongs to, for its friendly name; omit for content types. */
  entity?: EntityType;
}

/** A type's plugin icon and name; hovering or focusing shows the raw `pulp_type`. */
export const PulpTypeLabel: React.FC<IPulpTypeLabelProps> = ({
  pulpType,
  entity,
}) => {
  const typeIcon = getTypeIcon(pulpType);
  const text = entity ? getTypeLabel({ entity, pulpType }) : pulpType;
  const isRaw = text === pulpType;

  const label = (
    <Label
      color="blue"
      icon={typeIcon && createElement(typeIcon)}
      tabIndex={isRaw ? undefined : 0}
    >
      {text}
    </Label>
  );
  return isRaw ? label : <Tooltip content={pulpType}>{label}</Tooltip>;
};
