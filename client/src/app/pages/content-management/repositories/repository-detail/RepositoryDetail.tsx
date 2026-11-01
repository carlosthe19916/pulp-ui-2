import type React from "react";
import { Suspense, useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Spinner,
  Stack,
  StackItem,
  Tab,
  TabContentBody,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";

import type { RepositoryVersionResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { ObjectAccessPanel } from "@app/components/ObjectAccessPanel";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { PublishModal } from "@app/components/PublishModal";
import { RemoveContentModal } from "@app/components/RemoveContentModal";
import { RepositoryActionModal } from "@app/components/RepositoryActionModal";
import { RepositoryTaskAlert } from "@app/components/RepositoryTaskAlert";
import { SyncModal } from "@app/components/SyncModal";
import { UploadContentModal } from "@app/components/UploadContentModal";
import {
  type VersionAction,
  VersionActionModal,
} from "@app/components/VersionActionModal";
import { PersistentStateScopeProvider } from "@app/context/PersistentStateScope/PersistentStateScopeProvider";
import type { IContentUnitRef } from "@app/hooks/useContentUnitSelection";
import { useNotifications } from "@app/hooks/useNotifications";
import {
  useObjectPermissions,
  VERSION_ACTION_VERBS,
} from "@app/hooks/useObjectPermissions";
import { defineTabState, usePersistentTab } from "@app/hooks/usePersistentTab";
import { useRepositoryActivity } from "@app/hooks/useRepositoryActivity";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { usePublicationsListQuery } from "@app/queries/publications";
import {
  useRepositoryDeleteMutation,
  useRepositoryVersionDetailQuery,
  useRepositoryVersionsListQuery,
  useSuspenseRepositoryDetailQuery,
} from "@app/queries/repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { summaryTotal } from "@app/utils/contentSummary";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getPulpType, getRepositoryContentTypes } from "@catalog";
import type { IPluginAction } from "@plugin-sdk/ui";
import {
  getArchiveImport,
  getRepositoryActions,
  getRepositoryTab,
} from "@plugins";

import { AddContentModal } from "./components/AddContentModal";
import { RepositoryContentTab } from "./components/RepositoryContentTab";
import { RepositoryDetailsTab } from "./components/RepositoryDetailsTab";
import { RepositoryDistributionsTab } from "./components/RepositoryDistributionsTab";
import { RepositoryPublicationsTab } from "./components/RepositoryPublicationsTab";
import { RepositoryTopologyTab } from "./components/RepositoryTopologyTab";
import { RepositoryVersionsTab } from "./components/RepositoryVersionsTab";

interface IRepositoryDetailProps {
  pulpDomain: string;
  pulpType: string;
  id: string;
  href: string;
}

const REPOSITORY_DETAIL_FIXED_TABS = [
  "details",
  "content",
  "versions",
  "publications",
  "distributions",
  "topology",
];
// The plugin tab's key comes from the registry, so the keys are checked at runtime.
const REPOSITORY_DETAIL_TABS = defineTabState({ defaultValue: "details" });

export const RepositoryDetail: React.FC<IRepositoryDetailProps> = ({
  pulpDomain,
  pulpType,
  id,
  href,
}) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const { data: repository } = useSuspenseRepositoryDetailQuery({ href });
  const { contentChange, isRunning, running, lockedProps } =
    useRepositoryActivity({ repository });
  const { data: latestVersion } = useRepositoryVersionDetailQuery({
    href: repository.latest_version_href ?? null,
  });
  const latestTotal = summaryTotal(latestVersion?.content_summary?.present);
  const isLatestEmpty = latestTotal === 0;

  const { disabledProps } = useObjectPermissions({ href });
  const repoEntity = getPulpType(pulpType)?.entities.repository;
  const pluginTab = getRepositoryTab(pulpType);
  const repositoryActions = getRepositoryActions(pulpType).filter(
    (action) => action.target === "repository",
  );
  const canSync = (repoEntity?.compatibleRemoteTypes.length ?? 0) > 0;
  const canPublish = (repoEntity?.compatiblePublicationTypes.length ?? 0) > 0;
  const canChangeContent = !!repoEntity?.contentChanges;
  const uploadableTypes = canChangeContent
    ? getRepositoryContentTypes(pulpType).filter((type) => type.upload)
    : [];

  // Tab-title counts: one row each, read the paginated `count`.
  const { data: versionsCount } = useRepositoryVersionsListQuery({
    repositoryHref: href,
    params: { limit: 1 },
  });
  const { data: publicationsCount } = usePublicationsListQuery({
    params: { repository: href, limit: 1 },
  });
  const { data: distributionsCount } = useDistributionsListQuery({
    params: { repository: href, limit: 1 },
  });

  const deleteMutation = useRepositoryDeleteMutation({
    onSuccess: (data, { name }) => {
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: `Repository "${name}" deletion started`,
      });
      void navigate({
        to: "/content-management/$pulpDomain/repositories",
        params: { pulpDomain },
      });
    },
    onError: (error, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete repository "${name}"`,
        }),
        variant: "danger",
      }),
  });

  const {
    tab: activeTab,
    setTab: setActiveTab,
    selectTab,
  } = usePersistentTab({
    ...REPOSITORY_DETAIL_TABS,
    storage: "url",
    available: [
      ...REPOSITORY_DETAIL_FIXED_TABS,
      ...(pluginTab ? [pluginTab.key] : []),
      "access",
    ],
  });
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const archiveImport = getArchiveImport(pulpType);
  const [repoAction, setRepoAction] = useState<IPluginAction | null>(null);
  // Units to remove; "all" removes every unit.
  const [removeUnits, setRemoveUnits] = useState<
    IContentUnitRef[] | "all" | null
  >(null);
  const [versionAction, setVersionAction] = useState<{
    action: VersionAction;
    version: RepositoryVersionResponse;
  } | null>(null);

  return (
    <>
      <DocumentTitle title={`Repository · ${repository.name}`} />
      <PageHeader
        title={repository.name ?? extractIdFromHref(href)}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link
                to="/content-management/$pulpDomain/repositories"
                params={{ pulpDomain }}
              >
                Repositories
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{repository.name}</BreadcrumbItem>
          </Breadcrumb>
        }
        actionMenu={
          <PageHeaderActionsMenu
            actions={[
              {
                key: "edit",
                dropdownItemProps: {
                  children: "Edit",
                  onClick: () =>
                    void navigate({
                      to: "/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/edit",
                      params: {
                        pulpDomain,
                        repositoryType: pulpType,
                        repositoryId: extractIdFromHref(href),
                      },
                    }),
                  // Not locked by a running task: the edit page warns and Pulp queues the save.
                  ...disabledProps("change"),
                },
              },
              canSync && {
                key: "sync",
                dropdownItemProps: {
                  children: "Sync",
                  onClick: () => setIsSyncOpen(true),
                  ...lockedProps,
                  ...disabledProps("sync"),
                },
              },
              uploadableTypes.length > 0 && {
                key: "upload",
                dropdownItemProps: {
                  children: "Upload content…",
                  onClick: () => setIsUploadOpen(true),
                  ...lockedProps,
                  ...disabledProps("modify"),
                },
              },
              archiveImport && {
                key: "import-archive",
                dropdownItemProps: {
                  children: `${archiveImport.label}…`,
                  onClick: () => setIsImportOpen(true),
                  ...lockedProps,
                  ...disabledProps("modify"),
                },
              },
              canChangeContent && {
                key: "add-content",
                dropdownItemProps: {
                  children: "Add content…",
                  onClick: () => setIsAddContentOpen(true),
                  ...lockedProps,
                  ...disabledProps("modify"),
                },
              },
              canChangeContent && {
                key: "remove-all",
                dropdownItemProps: {
                  children: "Remove all content…",
                  onClick: () => setRemoveUnits("all"),
                  ...(isLatestEmpty ? { isDisabled: true } : lockedProps),
                  ...disabledProps("modify"),
                },
              },
              ...repositoryActions.map((action) => ({
                key: `action-${action.key}`,
                dropdownItemProps: {
                  children: `${action.label}…`,
                  description: action.description,
                  onClick: () => setRepoAction(action),
                  ...lockedProps,
                  ...disabledProps("modify"),
                },
              })),
              canPublish && {
                key: "publish",
                dropdownItemProps: {
                  children: "Publish",
                  onClick: () => setIsPublishOpen(true),
                  ...lockedProps,
                },
              },
              {
                key: "delete",
                dropdownItemProps: {
                  children: "Delete",
                  onClick: () => setIsDeleteOpen(true),
                  ...lockedProps,
                  ...disabledProps("delete"),
                },
              },
            ]}
          />
        }
      />

      <PageSection>
        <Stack hasGutter>
          {(running || contentChange.failure) && (
            <StackItem>
              <RepositoryTaskAlert
                repository={repository}
                running={running}
                failure={contentChange.failure}
                onCloseFailure={contentChange.clearFailure}
              />
            </StackItem>
          )}
          <StackItem>
            <Tabs
              activeKey={activeTab}
              onSelect={(_e, tabKey) => selectTab(tabKey)}
              mountOnEnter
            >
              <Tab
                eventKey="details"
                title={<TabTitleText>Details</TabTitleText>}
              >
                <TabContentBody hasPadding>
                  <RepositoryDetailsTab
                    repository={repository}
                    latestVersion={latestVersion}
                    pulpType={pulpType}
                    pulpDomain={pulpDomain}
                    onViewContent={() => setActiveTab("content")}
                    onViewDistributions={() => setActiveTab("distributions")}
                  />
                </TabContentBody>
              </Tab>
              <Tab
                eventKey="content"
                title={
                  <TabTitleText>
                    Content ({latestTotal.toLocaleString()})
                  </TabTitleText>
                }
              >
                <TabContentBody hasPadding>
                  <PersistentStateScopeProvider prefix="content">
                    <RepositoryContentTab
                      repository={repository}
                      pulpType={pulpType}
                      latestVersion={latestVersion}
                      writes={
                        canChangeContent
                          ? {
                              onRemove: setRemoveUnits,
                              isLocked: isRunning,
                              actionProps: {
                                ...lockedProps,
                                ...disabledProps("modify"),
                              },
                            }
                          : undefined
                      }
                    />
                  </PersistentStateScopeProvider>
                </TabContentBody>
              </Tab>
              <Tab
                eventKey="versions"
                title={
                  <TabTitleText>
                    Versions ({versionsCount?.count ?? 0})
                  </TabTitleText>
                }
              >
                <TabContentBody hasPadding>
                  <PersistentStateScopeProvider prefix="versions">
                    <RepositoryVersionsTab
                      onVersionAction={setVersionAction}
                      latestHref={repository.latest_version_href ?? undefined}
                      canRestore={repoEntity?.contentChanges === "modify"}
                      actionProps={(action) => ({
                        ...lockedProps,
                        ...disabledProps(VERSION_ACTION_VERBS[action]),
                      })}
                      repositoryHref={href}
                      id={id}
                      pulpType={pulpType}
                      pulpDomain={pulpDomain}
                    />
                  </PersistentStateScopeProvider>
                </TabContentBody>
              </Tab>
              <Tab
                eventKey="publications"
                title={
                  <TabTitleText>
                    Publications ({publicationsCount?.count ?? 0})
                  </TabTitleText>
                }
              >
                <TabContentBody hasPadding>
                  <PersistentStateScopeProvider prefix="publications">
                    <RepositoryPublicationsTab repositoryHref={href} />
                  </PersistentStateScopeProvider>
                </TabContentBody>
              </Tab>
              <Tab
                eventKey="distributions"
                title={
                  <TabTitleText>
                    Distributions ({distributionsCount?.count ?? 0})
                  </TabTitleText>
                }
              >
                <TabContentBody hasPadding>
                  <PersistentStateScopeProvider prefix="distributions">
                    <RepositoryDistributionsTab repositoryHref={href} />
                  </PersistentStateScopeProvider>
                </TabContentBody>
              </Tab>
              <Tab
                eventKey="topology"
                title={<TabTitleText>Topology</TabTitleText>}
              >
                <TabContentBody hasPadding>
                  <RepositoryTopologyTab
                    repository={repository}
                    pulpType={pulpType}
                    isRunning={isRunning}
                    onOpenTab={setActiveTab}
                  />
                </TabContentBody>
              </Tab>
              {pluginTab && (
                <Tab
                  eventKey={pluginTab.key}
                  title={<TabTitleText>{pluginTab.title}</TabTitleText>}
                >
                  <TabContentBody hasPadding>
                    <PersistentStateScopeProvider prefix={pluginTab.key}>
                      <Suspense fallback={<Spinner aria-label="Loading" />}>
                        <pluginTab.Tab repository={repository} />
                      </Suspense>
                    </PersistentStateScopeProvider>
                  </TabContentBody>
                </Tab>
              )}
              <Tab
                eventKey="access"
                title={<TabTitleText>Access</TabTitleText>}
              >
                <TabContentBody hasPadding>
                  <ObjectAccessPanel href={href} name={repository.name} />
                </TabContentBody>
              </Tab>
            </Tabs>
          </StackItem>
        </Stack>
      </PageSection>

      {isSyncOpen && (
        <SyncModal
          isOpen
          onClose={() => setIsSyncOpen(false)}
          repository={repository}
        />
      )}

      {isPublishOpen && (
        <PublishModal
          isOpen
          onClose={() => setIsPublishOpen(false)}
          repoHref={href}
        />
      )}

      {versionAction && (
        <VersionActionModal
          {...versionAction}
          repository={repository}
          onClose={() => setVersionAction(null)}
          onRestoreStarted={contentChange.watch}
        />
      )}

      {repoAction && (
        <RepositoryActionModal
          action={repoAction}
          repository={repository}
          targetHref={href}
          onClose={() => setRepoAction(null)}
        />
      )}

      {isUploadOpen && (
        <UploadContentModal
          contentTypes={uploadableTypes}
          repository={repository}
          onClose={() => setIsUploadOpen(false)}
          onStarted={contentChange.watch}
        />
      )}

      {isImportOpen && archiveImport && (
        <Suspense fallback={null}>
          <archiveImport.Modal
            repository={repository}
            onClose={() => setIsImportOpen(false)}
            onStarted={contentChange.watch}
          />
        </Suspense>
      )}

      {isAddContentOpen && (
        <AddContentModal
          repository={repository}
          repositoryType={pulpType}
          onClose={() => setIsAddContentOpen(false)}
          onStarted={contentChange.watch}
        />
      )}

      {removeUnits && (
        <RemoveContentModal
          repository={repository}
          units={removeUnits === "all" ? undefined : removeUnits}
          onClose={() => setRemoveUnits(null)}
          onStarted={contentChange.watch}
        />
      )}

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title="Delete Repository"
        body={`Are you sure you want to delete repository "${repository.name}"? This action cannot be undone.`}
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(repository, {
            onSuccess: () => setIsDeleteOpen(false),
          })
        }
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
