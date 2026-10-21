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

import { ContentDetailPanel } from "@app/components/ContentDetailPanel";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { buildContentHref } from "@app/queries/content";

import { ContentArtifactsTab } from "./components/ContentArtifactsTab";

interface IContentDetailProps {
  pulpDomain: string;
  pulpType: string;
  id: string;
}

/** The GitHub-style short identifier: first 8 chars of the content unit's pk. */
const SHORT_ID_LENGTH = 8;

export const ContentDetail: React.FC<IContentDetailProps> = ({
  pulpDomain,
  pulpType,
  id,
}) => {
  const domain = useSelectedDomain();
  const href = buildContentHref(pulpType, id, domain) ?? "";
  const shortId = id.slice(0, SHORT_ID_LENGTH);

  const [activeTab, setActiveTab] = useState<string | number>("details");

  return (
    <>
      <DocumentTitle title={`Content · ${pulpType}`} />
      <PageHeader
        title={pulpType}
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
            <BreadcrumbItem isActive>{shortId}</BreadcrumbItem>
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
              <ContentDetailPanel href={href} />
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
        </Tabs>
      </PageSection>
    </>
  );
};
