import type React from "react";

import { Label, LabelGroup } from "@patternfly/react-core";

export const PulpLabels: React.FC<{
  labels?: Record<string, string | null>;
}> = ({ labels }) => {
  const entries = Object.entries(labels ?? {});
  if (entries.length === 0) {
    return <>—</>;
  }
  return (
    <LabelGroup numLabels={8} isCompact>
      {entries.map(([key, value]) => (
        <Label key={key} isCompact>
          {value == null ? key : `${key}: ${value}`}
        </Label>
      ))}
    </LabelGroup>
  );
};
