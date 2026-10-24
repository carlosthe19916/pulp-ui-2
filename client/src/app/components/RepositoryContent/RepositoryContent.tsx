import type React from "react";
import { useState } from "react";

import {
  Tab,
  TabContentBody,
  TabTitleText,
  Tabs,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import type { ContentSummaryResponse } from "@app/client";
import type { IContentWrites } from "@app/hooks/useContentUnitSelection";

import { getPluginBrowse } from "./browseRegistry";
import { ContentDrawer } from "./ContentDrawer";
import { PluginBrowse } from "./PluginBrowse";
import { useServedAt } from "./useServedAt";
import { VersionContent } from "./VersionContent";

interface IRepositoryContentProps {
  repositoryHref: string;
  repositoryType: string;
  versionHref: string;
  summary?: ContentSummaryResponse;
  /** Bulk selection + Remove on every list; absent for a read-only version. */
  writes?: IContentWrites;
}

/**
 * A repository version's content: "Browse" in the plugin's own terms (collections, tags,
 * packages…) and "All content", the generic list. Plugins without a Browse view get only
 * the generic list. Each list keeps its own selection; switching tabs unmounts it.
 */
export const RepositoryContent: React.FC<IRepositoryContentProps> = ({
  repositoryHref,
  repositoryType,
  versionHref,
  summary,
  writes,
}) => {
  const browse = getPluginBrowse(repositoryType);
  const [activeTab, setActiveTab] = useState<string | number>("browse");
  const [selectedHref, setSelectedHref] = useState<string | null>(null);
  const served = useServedAt({ repositoryHref, repositoryType });

  if (!browse) {
    return (
      <VersionContent
        versionHref={versionHref}
        summary={summary}
        writes={writes}
      />
    );
  }

  return (
    <Tabs
      activeKey={activeTab}
      onSelect={(_event, key) => setActiveTab(key)}
      aria-label="Repository content"
      mountOnEnter
      unmountOnExit
    >
      <Tab eventKey="browse" title={<TabTitleText>Browse</TabTitleText>}>
        {/* PatternFly subtabs sit directly in the primary tab, so both tab bars align. */}
        <ContentDrawer
          selectedHref={selectedHref}
          onClose={() => setSelectedHref(null)}
        >
          <PluginBrowse
            browse={browse}
            summary={summary}
            context={{
              versionHref,
              repositoryHref,
              served,
              selectedHref: selectedHref ?? undefined,
              onSelect: setSelectedHref,
              writes,
            }}
          />
        </ContentDrawer>
      </Tab>
      <Tab eventKey="all" title={<TabTitleText>All content</TabTitleText>}>
        <TabContentBody className={spacing.ptMd}>
          <VersionContent
            versionHref={versionHref}
            summary={summary}
            writes={writes}
          />
        </TabContentBody>
      </Tab>
    </Tabs>
  );
};
