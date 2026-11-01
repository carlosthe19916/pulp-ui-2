import type React from "react";
import { Suspense, useState } from "react";

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
import type { IBrowseContext, IPluginBrowse } from "@plugin-sdk/ui";

import { visibleSections } from "./visibleSections";

interface IPluginBrowseProps {
  browse: IPluginBrowse;
  summary?: ContentSummaryResponse;
  context: IBrowseContext;
}

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
  const [activeKey, setActiveKey] = useState<string | number>(
    visible[0]?.section.key ?? "",
  );

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

  const active = visible.some(({ section }) => section.key === activeKey)
    ? activeKey
    : visible[0]?.section.key;

  return (
    <Tabs
      isSubtab
      aria-label="Browse sections"
      activeKey={active}
      onSelect={(_event, key) => setActiveKey(key)}
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
