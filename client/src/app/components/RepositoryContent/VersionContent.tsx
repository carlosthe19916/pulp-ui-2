import type React from "react";
import { useState } from "react";

import type { ContentSummaryResponse } from "@app/client";
import type { IContentWrites } from "@app/hooks/useContentUnitSelection";

import { ContentDrawer } from "./ContentDrawer";
import { VersionContentList } from "./VersionContentList";

interface IVersionContentProps {
  versionHref: string;
  summary?: ContentSummaryResponse;
  writes?: IContentWrites;
}

/** A repository version's content list; clicking a unit opens it in a side drawer. */
export const VersionContent: React.FC<IVersionContentProps> = ({
  versionHref,
  summary,
  writes,
}) => {
  const [selectedHref, setSelectedHref] = useState<string | null>(null);

  return (
    <ContentDrawer
      selectedHref={selectedHref}
      versionHref={versionHref}
      onClose={() => setSelectedHref(null)}
    >
      <VersionContentList
        versionHref={versionHref}
        summary={summary}
        selectedHref={selectedHref ?? undefined}
        onSelect={setSelectedHref}
        writes={writes}
      />
    </ContentDrawer>
  );
};
