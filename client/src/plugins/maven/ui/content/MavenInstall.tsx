import type React from "react";

import { Tab, Tabs, TabTitleText } from "@patternfly/react-core";

import { ContentSection } from "@app/components/ContentPanelLayout";
import { Snippet } from "@app/components/Snippet";
import { defineTabState, usePersistentTab } from "@app/hooks/usePersistentTab";

interface IMavenInstallProps {
  groupId: string;
  artifactId: string;
  version: string;
}

// A preference: the browser remembers the build tool across visits.
const BUILD_TOOL_TABS = defineTabState({
  param: "tool",
  tabs: ["maven", "gradle"],
  defaultValue: "maven",
});

/** Maven / Gradle dependency snippets for one GAV, as Maven Central shows them. */
export const MavenInstall: React.FC<IMavenInstallProps> = ({
  groupId,
  artifactId,
  version,
}) => {
  const { tab: tool, selectTab } = usePersistentTab({
    ...BUILD_TOOL_TABS,
    storage: "local",
  });
  return (
    <ContentSection title="Install">
      <Tabs
        activeKey={tool}
        onSelect={(_e, key) => selectTab(key)}
        isSubtab
        aria-label="Build tool"
      >
        <Tab eventKey="maven" title={<TabTitleText>Maven</TabTitleText>}>
          <Snippet
            code={[
              "<dependency>",
              `  <groupId>${groupId}</groupId>`,
              `  <artifactId>${artifactId}</artifactId>`,
              `  <version>${version}</version>`,
              "</dependency>",
            ].join("\n")}
          />
        </Tab>
        <Tab eventKey="gradle" title={<TabTitleText>Gradle</TabTitleText>}>
          <Snippet
            code={`implementation '${groupId}:${artifactId}:${version}'`}
          />
        </Tab>
      </Tabs>
    </ContentSection>
  );
};
