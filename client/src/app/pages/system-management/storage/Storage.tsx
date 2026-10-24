import type React from "react";
import { useState } from "react";

import {
  Content,
  ContentVariants,
  PageSection,
  Tab,
  TabContentBody,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";

import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";

import { ArtifactsTab } from "./components/ArtifactsTab";
import { UploadsTab } from "./components/UploadsTab";

/** Stored files: artifacts (content files) and chunked uploads. */
export const Storage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string | number>("artifacts");
  return (
    <>
      <DocumentTitle title="Storage" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Storage</Content>
        <Content component={ContentVariants.p}>
          Files stored in this domain. To free space in bulk, use Maintenance.
        </Content>
      </PageSection>
      <PageSection>
        <Tabs
          activeKey={activeTab}
          onSelect={(_event, key) => setActiveTab(key)}
          mountOnEnter
        >
          <Tab
            eventKey="artifacts"
            title={<TabTitleText>Artifacts</TabTitleText>}
          >
            <TabContentBody hasPadding>
              <ArtifactsTab />
            </TabContentBody>
          </Tab>
          <Tab eventKey="uploads" title={<TabTitleText>Uploads</TabTitleText>}>
            <TabContentBody hasPadding>
              <UploadsTab />
            </TabContentBody>
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
};
