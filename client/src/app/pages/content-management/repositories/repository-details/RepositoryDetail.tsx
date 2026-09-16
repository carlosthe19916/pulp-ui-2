import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Stack,
  StackItem,
  Tab,
  TabContentBody,
  TabTitleText,
  Tabs,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PublishModal } from "@app/components/PublishModal";
import { SyncModal } from "@app/components/SyncModal";
import { useNotifications } from "@app/context/useNotifications";
import { getDescriptor } from "@app/descriptors/registry";
import { useContentListQuery } from "@app/queries/content";
import { useDistributionsListQuery } from "@app/queries/distributions";
import {
  useFileRepositoryDeleteMutation,
  useFileRepositoryVersionsListQuery,
  useSuspenseFileRepositoryDetailQuery,
} from "@app/queries/file-repositories";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { RepositoryModal } from "../components/RepositoryModal";
import { RepositoryContentTab } from "./components/RepositoryContentTab";
import { RepositoryDetailsTab } from "./components/RepositoryDetailsTab";
import { RepositoryDistributionsTab } from "./components/RepositoryDistributionsTab";
import { RepositoryVersionsTab } from "./components/RepositoryVersionsTab";

interface IRepositoryDetailProps {
  repoId: string;
}

export const RepositoryDetail: React.FC<IRepositoryDetailProps> = ({
  repoId,
}) => {
  const navigate = useNavigate();
  const { data: repo } = useSuspenseFileRepositoryDetailQuery(repoId);
  const repoDisplayName = repo.name ?? "Repository";
  const deleteMutation = useFileRepositoryDeleteMutation();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState<string | number>("details");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  const descriptor = getDescriptor("repository", "file.file");

  // Tab-title count badges: fetch one row and read the paginated `count` so the
  // badge reflects the true total without pulling every record.
  const { data: versionsData } = useFileRepositoryVersionsListQuery(repoId, {
    limit: 1,
  });
  const { data: distributionsData } = useDistributionsListQuery(
    { repository: repo.pulp_href, limit: 1 },
    { enabled: !!repo.pulp_href },
  );
  const versionCount = versionsData?.count ?? 0;
  const distributionCount = distributionsData?.count ?? 0;
  const latestVersionHref = versionsData?.results?.[0]?.pulp_href ?? undefined;
  const { data: contentData } = useContentListQuery(
    { repository_version: latestVersionHref, limit: 1 },
    { enabled: !!latestVersionHref },
  );
  const contentCount = contentData?.count ?? 0;

  const handleDelete = async () => {
    if (!repo.pulp_href) return;
    try {
      const result = await deleteMutation.mutateAsync(repo.pulp_href);
      if (result?.task) {
        notifyTaskStarted(
          addNotification,
          result.task,
          `Repository "${repoDisplayName}" deletion started`,
        );
      } else {
        addNotification({
          title: `Repository "${repoDisplayName}" deleted`,
          variant: "success",
        });
      }
      void navigate({ to: "/content-management/repositories" });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete repository"),
        variant: "danger",
      });
    }
    setIsDeleteOpen(false);
  };

  return (
    <>
      <DocumentTitle title={repoDisplayName} />
      <PageHeader
        title={repoDisplayName}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to="/content-management/repositories">Repositories</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{repoDisplayName}</BreadcrumbItem>
          </Breadcrumb>
        }
        actionMenu={
          <PageHeaderActionsMenu
            actions={[
              {
                key: "edit",
                dropdownItemProps: {
                  children: "Edit",
                  onClick: () => setIsEditOpen(true),
                },
              },
              descriptor?.supportsSync && {
                key: "sync",
                dropdownItemProps: {
                  children: "Sync",
                  onClick: () => setIsSyncOpen(true),
                },
              },
              descriptor?.supportsPublish && {
                key: "publish",
                dropdownItemProps: {
                  children: "Publish",
                  onClick: () => setIsPublishOpen(true),
                },
              },
              {
                key: "delete",
                dropdownItemProps: {
                  children: "Delete",
                  isDanger: true,
                  onClick: () => setIsDeleteOpen(true),
                },
              },
            ]}
          />
        }
      />

      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <Tabs
              activeKey={activeTab}
              onSelect={(_e, tabKey) => setActiveTab(tabKey)}
            >
              <Tab
                eventKey="details"
                title={<TabTitleText>Details</TabTitleText>}
              >
                <TabContentBody hasPadding>
                  <RepositoryDetailsTab repo={repo} descriptor={descriptor} />
                </TabContentBody>
              </Tab>

              <Tab
                eventKey="versions"
                title={<TabTitleText>Versions ({versionCount})</TabTitleText>}
              >
                <TabContentBody hasPadding>
                  <RepositoryVersionsTab repoId={repoId} />
                </TabContentBody>
              </Tab>

              <Tab
                eventKey="distributions"
                title={
                  <TabTitleText>
                    Distributions ({distributionCount})
                  </TabTitleText>
                }
              >
                <TabContentBody hasPadding>
                  <RepositoryDistributionsTab repoHref={repo.pulp_href ?? ""} />
                </TabContentBody>
              </Tab>

              <Tab
                eventKey="content"
                title={<TabTitleText>Content ({contentCount})</TabTitleText>}
              >
                <TabContentBody hasPadding>
                  <RepositoryContentTab
                    repoId={repoId}
                    repoHref={repo.pulp_href ?? ""}
                    descriptor={descriptor}
                  />
                </TabContentBody>
              </Tab>
            </Tabs>
          </StackItem>
        </Stack>
      </PageSection>

      <RepositoryModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        repository={repo}
      />

      <SyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        repoHref={repo.pulp_href ?? ""}
        remoteSuggestion={repo.remote ?? undefined}
      />

      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        repoHref={repo.pulp_href ?? ""}
      />

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title="Delete Repository"
        body={`Are you sure you want to delete repository "${repoDisplayName}"? This action cannot be undone.`}
        isConfirming={deleteMutation.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
