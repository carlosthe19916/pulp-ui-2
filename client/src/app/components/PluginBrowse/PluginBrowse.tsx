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

import { visibleSections } from "./registry";
import type { IBrowseContext, IPluginBrowse } from "./types";

/** A plugin's Browse sections as sub-tabs; a single section renders without the tab bar. */
export const PluginBrowse: React.FC<{
  browse: IPluginBrowse;
  summary?: ContentSummaryResponse;
  context: IBrowseContext;
}> = ({ browse, summary, context }) => {
  const visible = visibleSections({ sections: browse.sections, summary });
  const [activeKey, setActiveKey] = useState<string | number>(
    visible[0]?.section.key ?? "",
  );

  if (visible.length === 1) {
    const { View } = visible[0].section;
    return (
      <div className={spacing.ptMd}>
        <View {...context} />
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
            <section.View {...context} />
          </TabContentBody>
        </Tab>
      ))}
    </Tabs>
  );
};
