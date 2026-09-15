import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
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
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import {
  DataView,
  DataViewTable,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type {
  DistributionResponse,
  MultipleArtifactContentResponse,
} from "@app/client";

type DistributionRow = DistributionResponse & {
  publication?: string | null;
  repository?: string | null;
};
import { dataViewBodyStates } from "@app/components/DataView";
import { DescriptorDetailFields } from "@app/components/DescriptorDetailFields";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { useNotifications } from "@app/context/useNotifications";
import { getDescriptor } from "@app/descriptors/registry";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { useContentListQuery } from "@app/queries/content";
import { useDistributionsListQuery } from "@app/queries/distributions";
import {
  useFileRepositoryDeleteMutation,
  useFileRepositoryDetailQuery,
  useFileRepositoryVersionsListQuery,
} from "@app/queries/file-repositories";
import {
  buildRepositoryHref,
  extractIdFromHref,
} from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import { EditRepositoryModal } from "./components/EditRepositoryModal";
import { PublishModal } from "@app/components/PublishModal";
import { SyncModal } from "@app/components/SyncModal";
import { UploadModal } from "@app/components/UploadModal";

type ContentRow = MultipleArtifactContentResponse & {
  relative_path?: string;
  sha256?: string;
};

interface IRepositoryDetailProps {
  repoId: string;
}

export const RepositoryDetail: React.FC<IRepositoryDetailProps> = ({
  repoId,
}) => {
  const navigate = useNavigate();
  const domain = useApiDomain();
  const repoHref = buildRepositoryHref(repoId, domain);
  const {
    data: repo,
    isLoading,
    error,
  } = useFileRepositoryDetailQuery(repoHref);
  const repoDisplayName = repo?.name ?? "Repository";
  const { data: versionsData, isLoading: isVersionsLoading } =
    useFileRepositoryVersionsListQuery(repoHref);
  const { data: distributionsData, isLoading: isDistributionsLoading } =
    useDistributionsListQuery({
      repository: repoHref,
      limit: 50,
    });
  const deleteMutation = useFileRepositoryDeleteMutation();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState<string | number>("details");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const descriptor = getDescriptor("repository", "file.file");

  const versions = versionsData?.results ?? [];
  const latestVersionHref = versions[0]?.pulp_href ?? undefined;
  const { data: contentData, isLoading: isContentLoading } =
    useContentListQuery(
      {
        repository_version: latestVersionHref,
        limit: 50,
      },
      { enabled: !!latestVersionHref },
    );
  const distributions = (distributionsData?.results ?? []) as DistributionRow[];
  const contentUnits = (contentData?.results ?? []) as ContentRow[];

  const versionColumns = ["Version", "Created", "Content count"];

  const versionRows: DataViewTr[] = versions.map((version) => {
    const summary = version.content_summary;
    const contentCount = summary?.present
      ? Object.values(summary.present).reduce(
          (sum, entry) => sum + ((entry as { count?: number }).count ?? 0),
          0,
        )
      : "—";
    return {
      id: version.pulp_href,
      row: [
        { cell: version.number ?? "—", props: { dataLabel: "Version" } },
        {
          cell: formatDateTime(version.pulp_created) ?? "—",
          props: { dataLabel: "Created" },
        },
        { cell: contentCount, props: { dataLabel: "Content count" } },
      ],
    };
  });

  const distributionColumns = ["Name", "Base path", "Publication"];

  const distributionRows: DataViewTr[] = distributions.map((dist) => {
    const href = dist.pulp_href;
    return {
      id: href,
      row: [
        {
          cell:
            href != null ? (
              <Link
                to="/content-management/distributions/$distId"
                params={{ distId: extractIdFromHref(href) }}
              >
                {dist.name}
              </Link>
            ) : (
              dist.name
            ),
          props: { dataLabel: "Name" },
        },
        { cell: dist.base_path || "—", props: { dataLabel: "Base path" } },
        {
          cell: <ResourceHrefLink kind="publication" href={dist.publication} />,
          props: { dataLabel: "Publication" },
        },
      ],
    };
  });

  const contentColumns = ["Path", "SHA256"];

  const contentRows: DataViewTr[] = contentUnits.map((unit) => {
    const href = unit.pulp_href;
    const label = unit.relative_path ?? "—";
    const sha = unit.sha256;
    return {
      id: href,
      row: [
        {
          cell: href ? (
            <Link
              to="/content-management/content/$contentId"
              params={{ contentId: extractIdFromHref(href) }}
            >
              {label}
            </Link>
          ) : (
            label
          ),
          props: { dataLabel: "Path" },
        },
        {
          cell: !sha ? "—" : sha.length > 20 ? `${sha.slice(0, 20)}...` : sha,
          props: { dataLabel: "SHA256" },
        },
      ],
    };
  });

  const handleDelete = async () => {
    try {
      const result = await deleteMutation.mutateAsync(repoHref);
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

  const versionsStates = dataViewBodyStates({
    loading: isVersionsLoading,
    empty: versions.length === 0,
    emptyState: "No versions found.",
  });
  const repoDistributionsStates = dataViewBodyStates({
    loading: isDistributionsLoading,
    empty: distributions.length === 0,
    emptyState: "No distributions point at this repository.",
  });
  const repoContentStates = dataViewBodyStates({
    loading: isContentLoading,
    empty: contentUnits.length === 0,
    emptyState: "No content in the latest version.",
  });

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
            <PageSection>
              <Breadcrumb>
                <BreadcrumbItem>
                  <Link to="/content-management/repositories">
                    Repositories
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbItem isActive>{repoDisplayName}</BreadcrumbItem>
              </Breadcrumb>
            </PageSection>

            <PageSection>
              <Stack hasGutter>
                <StackItem>
                  <Content component={ContentVariants.h1}>
                    {repoDisplayName}
                  </Content>
                </StackItem>

                <StackItem>
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
                </StackItem>

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
                        <DescriptionList isHorizontal>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Name</DescriptionListTerm>
                            <DescriptionListDescription>
                              {repoDisplayName}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>
                              Description
                            </DescriptionListTerm>
                            <DescriptionListDescription>
                              {repo.description || "—"}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Remote</DescriptionListTerm>
                            <DescriptionListDescription>
                              <ResourceHrefLink
                                kind="remote"
                                href={repo.remote}
                              />
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>
                              Retain repo versions
                            </DescriptionListTerm>
                            <DescriptionListDescription>
                              {repo.retain_repo_versions ?? "All"}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Created</DescriptionListTerm>
                            <DescriptionListDescription>
                              {formatDateTime(repo.pulp_created) ?? "—"}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptorDetailFields
                            fields={descriptor?.detailFields}
                            entity={repo}
                            skipKeys={["remote"]}
                          />
                        </DescriptionList>
                      </TabContentBody>
                    </Tab>

                    <Tab
                      eventKey="versions"
                      title={
                        <TabTitleText>
                          Versions ({versions.length})
                        </TabTitleText>
                      }
                    >
                      <TabContentBody hasPadding>
                        <DataView activeState={versionsStates.activeState}>
                          <DataViewTable
                            aria-label="Repository versions table"
                            columns={versionColumns}
                            rows={versionRows}
                            bodyStates={versionsStates.bodyStates}
                          />
                        </DataView>
                      </TabContentBody>
                    </Tab>

                    <Tab
                      eventKey="distributions"
                      title={
                        <TabTitleText>
                          Distributions ({distributions.length})
                        </TabTitleText>
                      }
                    >
                      <TabContentBody hasPadding>
                        <DataView
                          activeState={repoDistributionsStates.activeState}
                        >
                          <DataViewTable
                            aria-label="Repository distributions table"
                            columns={distributionColumns}
                            rows={distributionRows}
                            bodyStates={repoDistributionsStates.bodyStates}
                          />
                        </DataView>
                      </TabContentBody>
                    </Tab>

                    <Tab
                      eventKey="content"
                      title={
                        <TabTitleText>
                          Content ({contentUnits.length})
                        </TabTitleText>
                      }
                    >
                      <TabContentBody hasPadding>
                        <Stack hasGutter>
                          <StackItem>
                            {descriptor?.supportsUpload !== false && (
                              <Button
                                variant="secondary"
                                onClick={() => setIsUploadOpen(true)}
                              >
                                Upload content
                              </Button>
                            )}
                          </StackItem>
                          <StackItem>
                            {!latestVersionHref ? (
                              <Content component={ContentVariants.p}>
                                No repository version yet. Sync or upload
                                content to create one.
                              </Content>
                            ) : (
                              <DataView
                                activeState={repoContentStates.activeState}
                              >
                                <DataViewTable
                                  aria-label="Repository content table"
                                  columns={contentColumns}
                                  rows={contentRows}
                                  bodyStates={repoContentStates.bodyStates}
                                />
                              </DataView>
                            )}
                          </StackItem>
                        </Stack>
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
              repoHref={repoHref}
              remoteSuggestion={repo.remote ?? undefined}
            />

            <PublishModal
              isOpen={isPublishOpen}
              onClose={() => setIsPublishOpen(false)}
              repoHref={repoHref}
            />

            <UploadModal
              isOpen={isUploadOpen}
              onClose={() => setIsUploadOpen(false)}
              repositoryHref={repoHref}
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
