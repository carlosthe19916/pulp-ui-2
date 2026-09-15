import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Stack,
  StackItem,
  Tab,
  TabContentBody,
  TabTitleText,
  Tabs,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PublishModal } from "@app/components/PublishModal";
import { SyncModal } from "@app/components/SyncModal";
import { useNotifications } from "@app/context/useNotifications";
import { getDescriptor } from "@app/descriptors/registry";
import { useContentListQuery } from "@app/queries/content";
import { useDistributionsListQuery } from "@app/queries/distributions";
import {
  useFileRepositoryDeleteMutation,
  useFileRepositoryDetailQuery,
  useFileRepositoryVersionsListQuery,
} from "@app/queries/file-repositories";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { EditRepositoryModal } from "./components/EditRepositoryModal";
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
  const { data: repo, isLoading, error } = useFileRepositoryDetailQuery(repoId);
  const repoDisplayName = repo?.name ?? "Repository";
  const deleteMutation = useFileRepositoryDeleteMutation();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState<string | number>("details");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  const descriptor = getDescriptor("repository", "file.file");

  // Queries kept here only to render the dynamic tab-title counts. React Query
  // dedupes these against the same hooks called inside the tab components, so
  // no extra requests are made.
  const { data: versionsData } = useFileRepositoryVersionsListQuery(repoId);
  const { data: distributionsData } = useDistributionsListQuery(
    { repository: repo?.pulp_href, limit: 50 },
    { enabled: !!repo?.pulp_href },
  );
  const versionCount = versionsData?.results?.length ?? 0;
  const distributionCount = distributionsData?.results?.length ?? 0;
  const latestVersionHref = versionsData?.results?.[0]?.pulp_href ?? undefined;
  const { data: contentData } = useContentListQuery(
    { repository_version: latestVersionHref, limit: 50 },
    { enabled: !!latestVersionHref },
  );
  const contentCount = contentData?.results?.length ?? 0;

  const handleDelete = async () => {
    if (!repo?.pulp_href) return;
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
      <DetailQueryGate
        isLoading={isLoading}
        error={error}
        hasData={!!repo}
        loadingLabel="Loading repository"
      >
        {repo ? (
          <>
            <PageHeader
              title={repoDisplayName}
              breadcrumbs={
                <Breadcrumb>
                  <BreadcrumbItem>
                    <Link to="/content-management/repositories">
                      Repositories
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem isActive>{repoDisplayName}</BreadcrumbItem>
                </Breadcrumb>
              }
              actionMenu={
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditOpen(true)}
                    className={spacing.mrSm}
                  >
                    Edit
                  </Button>
                  {descriptor?.supportsSync && (
                    <Button
                      variant="primary"
                      onClick={() => setIsSyncOpen(true)}
                      className={spacing.mrSm}
                    >
                      Sync
                    </Button>
                  )}
                  {descriptor?.supportsPublish && (
                    <Button
                      variant="secondary"
                      onClick={() => setIsPublishOpen(true)}
                      className={spacing.mrSm}
                    >
                      Publish
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    Delete
                  </Button>
                </>
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
                        <RepositoryDetailsTab
                          repo={repo}
                          descriptor={descriptor}
                        />
                      </TabContentBody>
                    </Tab>

                    <Tab
                      eventKey="versions"
                      title={
                        <TabTitleText>Versions ({versionCount})</TabTitleText>
                      }
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
                        <RepositoryDistributionsTab
                          repoHref={repo.pulp_href ?? ""}
                        />
                      </TabContentBody>
                    </Tab>

                    <Tab
                      eventKey="content"
                      title={
                        <TabTitleText>Content ({contentCount})</TabTitleText>
                      }
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

            <EditRepositoryModal
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

            <Modal
              isOpen={isDeleteOpen}
              onClose={() => setIsDeleteOpen(false)}
              variant="small"
            >
              <ModalHeader title="Delete Repository" />
              <ModalBody>
                Are you sure you want to delete repository &quot;
                {repoDisplayName}&quot;? This action cannot be undone.
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="danger"
                  onClick={() => void handleDelete()}
                  isLoading={deleteMutation.isPending}
                >
                  Delete
                </Button>
                <Button variant="link" onClick={() => setIsDeleteOpen(false)}>
                  Cancel
                </Button>
              </ModalFooter>
            </Modal>
          </>
        ) : null}
      </DetailQueryGate>
    </>
  );
};
