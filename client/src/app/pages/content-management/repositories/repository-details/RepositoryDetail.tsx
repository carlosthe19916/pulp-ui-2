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

import { getEntityLabel } from "@catalog";
import type { FileFileRepositoryResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { EntityModal } from "@app/components/Entity/EntityModal";
import {
  PageHeaderActionsMenu,
  type PageHeaderAction,
} from "@app/components/PageHeaderActionsMenu";
import { PublishModal } from "@app/components/PublishModal";
import { SyncModal } from "@app/components/SyncModal";
import { REPOSITORY_FAMILY } from "@app/queries/utils/families";
import { useEntityDelete } from "@app/hooks/useEntityDelete";
import { useEntityDetail } from "@app/hooks/useEntityDetail";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { withId } from "@app/models/models";
import { useContentListQuery } from "@app/queries/content";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { useRepositoryVersionsListQuery } from "@app/queries/repositories";

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
  const domain = useSelectedDomain();

  const { entity: repo, plugin } = useEntityDetail<FileFileRepositoryResponse>(
    REPOSITORY_FAMILY,
    repoId,
  );
  const repoHref = repo.pulp_href ?? "";
  const repoPlugin = plugin?.entities.repository;
  // Collection sub-path (e.g. "file/file") used to rebuild per-item endpoints
  // (versions) client-side instead of appending to the server pulp_href.
  const apiPath = repoPlugin?.apiPath;
  const label = getEntityLabel(REPOSITORY_FAMILY.kind);
  const title = repo.name ?? label;

  const [activeTab, setActiveTab] = useState<string | number>("details");
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { deleteEntity, isDeleting } = useEntityDelete(REPOSITORY_FAMILY);

  // Tab-title count badges: fetch one row and read the paginated `count` so the
  // badge reflects the true total without pulling every record.
  const { data: versionsData } = useRepositoryVersionsListQuery(
    apiPath,
    repoId,
    { limit: 1 },
  );
  const { data: distributionsData } = useDistributionsListQuery(
    { repository: repoHref, limit: 1 },
    { enabled: !!repoHref },
  );
  const versionCount = versionsData?.count ?? 0;
  const distributionCount = distributionsData?.count ?? 0;
  const latestVersionHref = versionsData?.results?.[0]?.pulp_href ?? undefined;
  const { data: contentData } = useContentListQuery(
    { repository_version: latestVersionHref, limit: 1 },
    { enabled: !!latestVersionHref },
  );
  const contentCount = contentData?.count ?? 0;

  const backToList = () =>
    navigate({
      to: "/content-management/$pulpDomain/repositories",
      params: { pulpDomain: domain.name },
    });

  const handleDelete = async () => {
    if (!repo.pulp_href) return;
    try {
      await deleteEntity({
        name: repo.name,
        pulp_href: repo.pulp_href,
      });
      void backToList();
    } catch {
      // Notifications are handled in useEntityDelete.
    }
    setIsDeleteOpen(false);
  };

  // A plugin is editable iff it exposes edit fields.
  const canEdit = (repoPlugin?.form.editFields.length ?? 0) > 0;

  const actions: (PageHeaderAction | false | null | undefined)[] = [
    canEdit && {
      key: "edit",
      dropdownItemProps: {
        children: "Edit",
        onClick: () => setIsEditOpen(true),
      },
    },
    (repoPlugin?.compatibleRemoteTypes.length ?? 0) > 0 && {
      key: "sync",
      dropdownItemProps: {
        children: "Sync",
        onClick: () => setIsSyncOpen(true),
      },
    },
    (repoPlugin?.compatiblePublicationTypes.length ?? 0) > 0 && {
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
        onClick: () => setIsDeleteOpen(true),
      },
    },
  ];

  return (
    <>
      <DocumentTitle title={title} />
      <PageHeader
        title={title}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link
                to="/content-management/$pulpDomain/repositories"
                params={{ pulpDomain: domain.name }}
              >
                Repositories
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{title}</BreadcrumbItem>
          </Breadcrumb>
        }
        actionMenu={<PageHeaderActionsMenu actions={actions} />}
      />

      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <Tabs
              activeKey={activeTab}
              onSelect={(_e, tabKey) => setActiveTab(tabKey)}
              mountOnEnter
            >
              <Tab
                eventKey="details"
                title={<TabTitleText>Details</TabTitleText>}
              >
                <TabContentBody hasPadding>
                  <RepositoryDetailsTab repo={repo} />
                </TabContentBody>
              </Tab>

              <Tab
                eventKey="versions"
                title={<TabTitleText>Versions ({versionCount})</TabTitleText>}
              >
                <TabContentBody hasPadding>
                  <RepositoryVersionsTab apiPath={apiPath} id={repoId} />
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
                  <RepositoryDistributionsTab repoHref={repoHref} />
                </TabContentBody>
              </Tab>

              <Tab
                eventKey="content"
                title={<TabTitleText>Content ({contentCount})</TabTitleText>}
              >
                <TabContentBody hasPadding>
                  <RepositoryContentTab
                    repo={withId(repoId, repo)}
                    plugin={plugin}
                  />
                </TabContentBody>
              </Tab>
            </Tabs>
          </StackItem>
        </Stack>
      </PageSection>

      {canEdit && (
        <EntityModal
          config={REPOSITORY_FAMILY}
          isOpen={isEditOpen}
          entity={repo}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title={`Delete ${label}`}
        body={`Are you sure you want to delete ${label.toLowerCase()} "${title}"? This action cannot be undone.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />

      <SyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        repo={withId(repoId, repo)}
      />

      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        repoHref={repoHref}
      />
    </>
  );
};
