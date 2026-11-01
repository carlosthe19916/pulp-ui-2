import type React from "react";
import { Suspense } from "react";

import {
  Spinner,
  Tab,
  TabContentBody,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import type { ContentSummaryResponse } from "@app/client";
import { PersistentStateScopeProvider } from "@app/context/PersistentStateScope/PersistentStateScopeProvider";
import { defineTabState, usePersistentTab } from "@app/hooks/usePersistentTab";
import type { IBrowseContext, IPluginBrowse } from "@plugin-sdk/ui";

import { visibleSections } from "./visibleSections";

interface IPluginBrowseProps {
  browse: IPluginBrowse;
  summary?: ContentSummaryResponse;
  context: IBrowseContext;
}

// Section keys come from the plugin, so they're checked against the visible ones at runtime.
const SECTION_TABS = defineTabState({ param: "section", defaultValue: "" });

/**
 * A plugin's Browse sections as sub-tabs; a single section renders without the tab bar. Each
 * section's list state is scoped by its key (`packages.page`), so sections don't share it.
 */
export const PluginBrowse: React.FC<IPluginBrowseProps> = ({
  browse,
  summary,
  context,
}) => {
  const visible = visibleSections({ sections: browse.sections, summary });
  // Falls back to the first visible section when the stored one isn't shown.
  const { tab: active, selectTab } = usePersistentTab({
    ...SECTION_TABS,
    storage: "url",
    available: visible.map(({ section }) => section.key),
  });

  if (visible.length === 1) {
    const { key, View } = visible[0].section;
    return (
      <div className={spacing.ptMd}>
        <PersistentStateScopeProvider prefix={key}>
          <Suspense fallback={<Spinner aria-label="Loading" />}>
            <View {...context} />
          </Suspense>
        </PersistentStateScopeProvider>
      </div>
    );
  }

  return (
    <Tabs
      isSubtab
      aria-label="Browse sections"
      activeKey={active}
      onSelect={(_event, key) => selectTab(key)}
      mountOnEnter
      unmountOnExit
    >
      {visible.map(({ section, count }) => (
        <Tab
          key={section.key}
          eventKey={section.key}
          title={
            <TabTitleText>
              {section.showCount === false
                ? section.title
                : `${section.title} (${count.toLocaleString()})`}
            </TabTitleText>
          }
        >
          <TabContentBody className={spacing.ptMd}>
            <PersistentStateScopeProvider prefix={section.key}>
              <Suspense fallback={<Spinner aria-label="Loading" />}>
                <section.View {...context} />
              </Suspense>
            </PersistentStateScopeProvider>
          </TabContentBody>
        </Tab>
      ))}
    </Tabs>
  );
};
