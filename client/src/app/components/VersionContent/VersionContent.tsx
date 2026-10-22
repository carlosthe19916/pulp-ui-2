import type React from "react";
import { useState } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerContentBody,
} from "@patternfly/react-core";

import type { ContentSummaryResponse } from "@app/client";

import { ContentDrawerPanel } from "./ContentDrawerPanel";
import { VersionContentList } from "./VersionContentList";

interface IVersionContentProps {
  versionHref: string;
  summary?: ContentSummaryResponse;
}

/** A repository version's content list; clicking a unit opens it in a side drawer. */
export const VersionContent: React.FC<IVersionContentProps> = ({
  versionHref,
  summary,
}) => {
  const [selectedHref, setSelectedHref] = useState<string | null>(null);

  return (
    <Drawer isExpanded={selectedHref != null} isInline>
      <DrawerContent
        panelContent={
          <ContentDrawerPanel
            href={selectedHref}
            onClose={() => setSelectedHref(null)}
          />
        }
      >
        <DrawerContentBody>
          <VersionContentList
            versionHref={versionHref}
            summary={summary}
            selectedHref={selectedHref ?? undefined}
            onSelect={setSelectedHref}
          />
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};
