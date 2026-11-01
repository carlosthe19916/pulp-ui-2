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
import { PersistentStateScopeProvider } from "@app/context/PersistentStateScope/PersistentStateScopeProvider";

import { ExportersTab } from "./components/ExportersTab";
import { ImportersTab } from "./components/ImportersTab";

/** Move repositories between Pulp instances (or to disk) through files. */
export const ExportImport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string | number>("exporters");
  return (
    <>
      <DocumentTitle title="Export and import" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Export and import</Content>
        <Content component={ContentVariants.p}>
          Exporters write repositories to files on the server; importers load
          those files into this Pulp. Expand a row to see its past runs.
        </Content>
      </PageSection>
      <PageSection>
        <Tabs
          activeKey={activeTab}
          onSelect={(_event, key) => setActiveTab(key)}
          mountOnEnter
        >
          <Tab
            eventKey="exporters"
            title={<TabTitleText>Exporters</TabTitleText>}
          >
            <TabContentBody hasPadding>
              <PersistentStateScopeProvider prefix="exporters">
                <ExportersTab />
              </PersistentStateScopeProvider>
            </TabContentBody>
          </Tab>
          <Tab
            eventKey="importers"
            title={<TabTitleText>Importers</TabTitleText>}
          >
            <TabContentBody hasPadding>
              <PersistentStateScopeProvider prefix="importers">
                <ImportersTab />
              </PersistentStateScopeProvider>
            </TabContentBody>
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
};
