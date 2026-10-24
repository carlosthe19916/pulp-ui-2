import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Tab,
  TabContentBody,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";

import type { RepositoryResponse } from "@app/client";
import { AddToRepositoryModal } from "@app/components/AddToRepositoryModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { PluginContentPanel } from "@app/components/PluginContentPanel";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { RemoveContentModal } from "@app/components/RemoveContentModal";
import { useContentChangeTask } from "@app/hooks/useContentChangeTask";
import { useSuspenseContentDetailQuery } from "@app/queries/content";
import { getRepositoryTypesForContent } from "@catalog";

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
  const { data } = useSuspenseContentDetailQuery({ href });
  const prn = data.prn ?? id;

  const [activeTab, setActiveTab] = useState<string | number>("details");
  const canAdd = getRepositoryTypesForContent(pulpType).length > 0;
  const unit = { href, label: prn, pulpType };
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [removeFrom, setRemoveFrom] = useState<RepositoryResponse | null>(null);

  // One change at a time: actions wait until the running one settles.
  const contentChange = useContentChangeTask();
  const isChanging = !!contentChange.task;

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
        actionMenu={
          <PageHeaderActionsMenu
            actions={[
              canAdd && {
                key: "add",
                dropdownItemProps: {
                  children: "Add to repository…",
                  onClick: () => setIsAddOpen(true),
                  isDisabled: isChanging,
                },
              },
            ]}
          />
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
              <ContentRepositoriesTab
                href={href}
                onRemoveFromRepository={setRemoveFrom}
                isLocked={isChanging}
              />
            </TabContentBody>
          </Tab>
        </Tabs>
      </PageSection>

      {isAddOpen && (
        <AddToRepositoryModal
          units={[unit]}
          onClose={() => setIsAddOpen(false)}
          onStarted={contentChange.watch}
        />
      )}

      {removeFrom && (
        <RemoveContentModal
          repository={removeFrom}
          units={[unit]}
          onClose={() => setRemoveFrom(null)}
          onStarted={contentChange.watch}
        />
      )}
    </>
  );
};
