import type React from "react";

import { Label, LabelGroup } from "@patternfly/react-core";

interface IPulpLabelsProps {
  labels?: Record<string, string | null>;
}

export const PulpLabels: React.FC<IPulpLabelsProps> = ({ labels }) => {
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
