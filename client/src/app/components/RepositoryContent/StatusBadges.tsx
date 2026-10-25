import type React from "react";

import { Label, LabelGroup } from "@patternfly/react-core";

const STATUS = {
  signed: { text: "Signed", color: "green" },
  attested: { text: "Provenance", color: "green" },
  prerelease: { text: "Prerelease", color: "purple" },
  multiArch: { text: "Multi-arch", color: "blue" },
} as const;

export type BrowseStatus = keyof typeof STATUS;

interface IStatusBadgesProps {
  statuses: (BrowseStatus | false)[];
}

/** Small status labels next to an item; renders nothing when no status applies. */
export const StatusBadges: React.FC<IStatusBadgesProps> = ({ statuses }) => {
  const shown = statuses.filter((status): status is BrowseStatus => !!status);
  return shown.length ? (
    <LabelGroup>
      {shown.map((status) => (
        <Label key={status} isCompact color={STATUS[status].color}>
          {STATUS[status].text}
        </Label>
      ))}
    </LabelGroup>
  ) : null;
};
