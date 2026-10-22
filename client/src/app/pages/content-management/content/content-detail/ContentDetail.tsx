import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Tab,
  TabContentBody,
  TabTitleText,
  Tabs,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { DocumentTitle } from "@app/components/DocumentTitle";
import { PluginContentPanel } from "@app/components/PluginContentPanel";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { useContentDetailQuery } from "@app/queries/content";

import { ContentArtifactsTab } from "./components/ContentArtifactsTab";
import { ContentRepositoriesTab } from "./components/ContentRepositoriesTab";

interface IContentDetailProps {
  pulpDomain: string;
  pulpType: string;
  id: string;
  href: string;
}

export const ContentDetail: React.FC<IContentDetailProps> = ({
  pulpDomain,
  pulpType,
  id,
  href,
}) => {
  const { data } = useContentDetailQuery({ href });
  const prn = data?.prn ?? id;

  const [activeTab, setActiveTab] = useState<string | number>("details");

  return (
    <>
      <DocumentTitle title={`Content · ${pulpType}`} />
      <PageHeader
        title={prn}
        label={<PulpTypeLabel pulpType={pulpType} />}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link
                to="/content-management/$pulpDomain/content"
                params={{ pulpDomain }}
              >
                Content
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{prn}</BreadcrumbItem>
          </Breadcrumb>
        }
      />

      <PageSection>
        <Tabs
          activeKey={activeTab}
          onSelect={(_e, tabKey) => setActiveTab(tabKey)}
          mountOnEnter
        >
          <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>}>
            <TabContentBody hasPadding>
              <PluginContentPanel href={href} />
            </TabContentBody>
          </Tab>
          <Tab
            eventKey="artifacts"
            title={<TabTitleText>Artifacts</TabTitleText>}
          >
            <TabContentBody hasPadding>
              <ContentArtifactsTab href={href} />
            </TabContentBody>
          </Tab>
          <Tab
            eventKey="repositories"
            title={<TabTitleText>Repositories</TabTitleText>}
          >
            <TabContentBody hasPadding>
              <ContentRepositoriesTab href={href} />
            </TabContentBody>
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
};
