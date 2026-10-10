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
import { useFileRepositoryVersionsListQuery } from "@app/queries/file-repositories";

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
  const { data: versionsData } = useFileRepositoryVersionsListQuery(repoHref, {
    limit: 1,
  });
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
    try {
      await deleteEntity(repo);
      void backToList();
    } catch {
      // Notifications are handled in useEntityDelete.
    }
    setIsDeleteOpen(false);
  };

  // A plugin is editable iff it exposes edit fields.
  const canEdit = (plugin?.form.editFields.length ?? 0) > 0;

  const actions: (PageHeaderAction | false | null | undefined)[] = [
    canEdit && {
      key: "edit",
      dropdownItemProps: {
        children: "Edit",
        onClick: () => setIsEditOpen(true),
      },
    },
    plugin?.capabilities.sync && {
      key: "sync",
      dropdownItemProps: {
        children: "Sync",
        onClick: () => setIsSyncOpen(true),
      },
    },
    plugin?.capabilities.publish && {
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
                  <RepositoryDetailsTab repo={repo} plugin={plugin} />
                </TabContentBody>
              </Tab>

              <Tab
                eventKey="versions"
                title={<TabTitleText>Versions ({versionCount})</TabTitleText>}
              >
                <TabContentBody hasPadding>
                  <RepositoryVersionsTab repoHref={repoHref} />
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
