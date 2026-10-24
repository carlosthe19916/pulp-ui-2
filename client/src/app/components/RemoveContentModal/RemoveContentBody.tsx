import type React from "react";

import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import type { IContentUnitRef } from "@app/hooks/useContentUnitSelection";

import { summarizeUnits } from "./summarizeUnits";

const names = ({ labels, more }: { labels: string[]; more: number }) =>
  `${labels.join(" · ")}${more ? ` and ${more} more` : ""}`;

interface IRemoveContentBodyProps {
  units: IContentUnitRef[];
  isContainer: boolean;
}

/** Remove confirmation body: what happens, then the units (grouped by type when mixed). */
export const RemoveContentBody: React.FC<IRemoveContentBodyProps> = ({
  units,
  isContainer,
}) => {
  const groups = summarizeUnits({ units });
  return (
    <Stack hasGutter>
      <StackItem>
        This creates a new version without them. Older versions keep them.
        {isContainer &&
          " Removing a tag also removes the image it points to when nothing else uses it."}
      </StackItem>
      <StackItem>
        {groups.length === 1 ? (
          <Content component="p">{names(groups[0])}</Content>
        ) : (
          <DescriptionList isCompact isHorizontal>
            {groups.map((group) => (
              <DescriptionListGroup key={group.pulpType ?? ""}>
                <DescriptionListTerm>
                  {group.pulpType ?? "Content"} (
                  {group.labels.length + group.more})
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {names(group)}
                </DescriptionListDescription>
              </DescriptionListGroup>
            ))}
          </DescriptionList>
        )}
      </StackItem>
    </Stack>
  );
};
