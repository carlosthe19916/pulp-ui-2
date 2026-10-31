import type React from "react";
import { useState } from "react";

import { Tab, Tabs, TabTitleText } from "@patternfly/react-core";

import { ContentSection } from "@app/components/ContentPanelLayout";
import { Snippet } from "@app/components/Snippet";

interface IMavenInstallProps {
  groupId: string;
  artifactId: string;
  version: string;
}

/** Maven / Gradle dependency snippets for one GAV, as Maven Central shows them. */
export const MavenInstall: React.FC<IMavenInstallProps> = ({
  groupId,
  artifactId,
  version,
}) => {
  const [tool, setTool] = useState<string | number>("maven");
  return (
    <ContentSection title="Install">
      <Tabs
        activeKey={tool}
        onSelect={(_e, key) => setTool(key)}
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
