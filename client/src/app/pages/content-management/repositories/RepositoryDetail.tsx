import type React from "react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import dayjs from "dayjs";

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
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import type {
  DistributionResponse,
  MultipleArtifactContentResponse,
  RepositoryVersionResponse,
} from "@app/client";

type DistributionRow = DistributionResponse & {
  publication?: string | null;
  repository?: string | null;
};
import { DescriptorDetailFields } from "@app/components/DescriptorDetailFields";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { RENDER_DATETIME_FORMAT } from "@app/Constants";
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
import { getMutationErrorMessage } from "@app/utils/utils";

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

  const versionColumns = useMemo<ColumnDef<RepositoryVersionResponse>[]>(
    () => [
      {
        id: "number",
        header: "Version",
        cell: ({ row }) => row.original.number ?? "—",
      },
      {
        id: "pulp_created",
        header: "Created",
        cell: ({ row }) =>
          row.original.pulp_created
            ? dayjs(row.original.pulp_created).format(RENDER_DATETIME_FORMAT)
            : "—",
      },
      {
        id: "content_summary",
        header: "Content count",
        cell: ({ row }) => {
          const summary = row.original.content_summary;
          if (!summary?.present) return "—";
          const total = Object.values(summary.present).reduce(
            (sum, entry) => sum + ((entry as { count?: number }).count ?? 0),
            0,
          );
          return total;
        },
      },
    ],
    [],
  );

  const versionsTable = useReactTable({
    data: versions,
    columns: versionColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const distributionColumns = useMemo<ColumnDef<DistributionRow>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => {
          const href = row.original.pulp_href;
          if (!href) return row.original.name;
          const distId = extractIdFromHref(href);
          return (
            <Link
              to="/content-management/distributions/$distId"
              params={{ distId }}
            >
              {row.original.name}
            </Link>
          );
        },
      },
      {
        id: "base_path",
        header: "Base path",
        cell: ({ row }) => row.original.base_path || "—",
      },
      {
        id: "publication",
        header: "Publication",
        cell: ({ row }) => (
          <ResourceHrefLink
            kind="publication"
            href={row.original.publication}
          />
        ),
      },
    ],
    [],
  );

  const distributionsTable = useReactTable({
    data: distributions,
    columns: distributionColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const contentColumns = useMemo<ColumnDef<ContentRow>[]>(
    () => [
      {
        id: "path",
        header: "Path",
        cell: ({ row }) => {
          const href = row.original.pulp_href;
          const label = row.original.relative_path ?? "—";
          if (!href) return label;
          const contentId = extractIdFromHref(href);
          return (
            <Link
              to="/content-management/content/$contentId"
              params={{ contentId }}
            >
              {label}
            </Link>
          );
        },
      },
      {
        id: "sha256",
        header: "SHA256",
        cell: ({ row }) => {
          const value = row.original.sha256;
          if (!value) return "—";
          return value.length > 20 ? `${value.slice(0, 20)}...` : value;
        },
      },
    ],
    [],
  );

  const contentTable = useReactTable({
    data: contentUnits,
    columns: contentColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const handleDelete = async () => {
    try {
      const result = await deleteMutation.mutateAsync(repoHref);
      if (result?.task) {
        notifyTaskStarted(
          addNotification,
          result.task,
          "Repository deletion started",
        );
      } else {
        addNotification({
          title: "Repository deleted",
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
                              {repo.pulp_created
                                ? dayjs(repo.pulp_created).format(
                                    RENDER_DATETIME_FORMAT,
                                  )
                                : "—"}
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
                        {isVersionsLoading ? (
                          <Content component={ContentVariants.p}>
                            Loading versions...
                          </Content>
                        ) : (
                          <Table
                            aria-label="Repository versions table"
                            variant="compact"
                          >
                            <Thead>
                              {versionsTable
                                .getHeaderGroups()
                                .map((headerGroup) => (
                                  <Tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                      <Th key={header.id}>
                                        {header.isPlaceholder
                                          ? null
                                          : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext(),
                                            )}
                                      </Th>
                                    ))}
                                  </Tr>
                                ))}
                            </Thead>
                            <Tbody>
                              {versionsTable.getRowModel().rows.map((row) => (
                                <Tr key={row.id}>
                                  {row.getVisibleCells().map((cell) => (
                                    <Td key={cell.id}>
                                      {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext(),
                                      )}
                                    </Td>
                                  ))}
                                </Tr>
                              ))}
                              {versions.length === 0 && (
                                <Tr>
                                  <Td colSpan={versionColumns.length}>
                                    No versions found.
                                  </Td>
                                </Tr>
                              )}
                            </Tbody>
                          </Table>
                        )}
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
                        {isDistributionsLoading ? (
                          <Content component={ContentVariants.p}>
                            Loading distributions...
                          </Content>
                        ) : (
                          <Table
                            aria-label="Repository distributions table"
                            variant="compact"
                          >
                            <Thead>
                              {distributionsTable
                                .getHeaderGroups()
                                .map((headerGroup) => (
                                  <Tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                      <Th key={header.id}>
                                        {header.isPlaceholder
                                          ? null
                                          : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext(),
                                            )}
                                      </Th>
                                    ))}
                                  </Tr>
                                ))}
                            </Thead>
                            <Tbody>
                              {distributionsTable
                                .getRowModel()
                                .rows.map((row) => (
                                  <Tr key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                      <Td key={cell.id}>
                                        {flexRender(
                                          cell.column.columnDef.cell,
                                          cell.getContext(),
                                        )}
                                      </Td>
                                    ))}
                                  </Tr>
                                ))}
                              {distributions.length === 0 && (
                                <Tr>
                                  <Td colSpan={distributionColumns.length}>
                                    No distributions point at this repository.
                                  </Td>
                                </Tr>
                              )}
                            </Tbody>
                          </Table>
                        )}
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
                            ) : isContentLoading ? (
                              <Content component={ContentVariants.p}>
                                Loading content...
                              </Content>
                            ) : (
                              <Table
                                aria-label="Repository content table"
                                variant="compact"
                              >
                                <Thead>
                                  {contentTable
                                    .getHeaderGroups()
                                    .map((headerGroup) => (
                                      <Tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                          <Th key={header.id}>
                                            {header.isPlaceholder
                                              ? null
                                              : flexRender(
                                                  header.column.columnDef
                                                    .header,
                                                  header.getContext(),
                                                )}
                                          </Th>
                                        ))}
                                      </Tr>
                                    ))}
                                </Thead>
                                <Tbody>
                                  {contentTable
                                    .getRowModel()
                                    .rows.map((row) => (
                                      <Tr key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                          <Td key={cell.id}>
                                            {flexRender(
                                              cell.column.columnDef.cell,
                                              cell.getContext(),
                                            )}
                                          </Td>
                                        ))}
                                      </Tr>
                                    ))}
                                  {contentUnits.length === 0 && (
                                    <Tr>
                                      <Td colSpan={contentColumns.length}>
                                        No content in the latest version.
                                      </Td>
                                    </Tr>
                                  )}
                                </Tbody>
                              </Table>
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
