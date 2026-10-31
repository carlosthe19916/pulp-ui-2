import type React from "react";
import { useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
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
import { RepositoryModal } from "@app/components/RepositoryModal";
import { RepositoryTaskAlert } from "@app/components/RepositoryTaskAlert";
import { SyncModal } from "@app/components/SyncModal";
import { UploadContentModal } from "@app/components/UploadContentModal";
import {
  type VersionAction,
  VersionActionModal,
} from "@app/components/VersionActionModal";
import type { IContentUnitRef } from "@app/hooks/useContentUnitSelection";
import { useNotifications } from "@app/hooks/useNotifications";
import {
  useObjectPermissions,
  VERSION_ACTION_VERBS,
} from "@app/hooks/useObjectPermissions";
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
import {
  getPlugin,
  getRepositoryContentTypes,
  type IRepositoryAction,
} from "@catalog";

import { AddContentModal } from "./components/AddContentModal";
import { OstreeImportModal } from "./components/OstreeImportModal";
import { TAB_BY_REPOSITORY_TYPE } from "./components/pluginTabs";
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
  const isLatestEmpty =
    summaryTotal(latestVersion?.content_summary?.present) === 0;

  const { disabledProps } = useObjectPermissions({ href });
  const repoEntity = getPlugin(pulpType)?.entities.repository;
  const pluginTab = TAB_BY_REPOSITORY_TYPE[pulpType];
  const repositoryActions = (repoEntity?.actions ?? []).filter(
    (action) => action.target === "repository",
  );
  const canSync = (repoEntity?.compatibleRemoteTypes.length ?? 0) > 0;
  const canPublish = (repoEntity?.compatiblePublicationTypes.length ?? 0) > 0;
  const canChangeContent = !!repoEntity?.contentChanges;
  const uploadableTypes = canChangeContent
    ? getRepositoryContentTypes(pulpType).filter((type) => type.uploadable)
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

  const [activeTab, setActiveTab] = useState<string | number>("details");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [repoAction, setRepoAction] = useState<IRepositoryAction | null>(null);
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
                  onClick: () => setIsEditOpen(true),
                  ...lockedProps,
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
              repoEntity?.archiveImport && {
                key: "import-archive",
                dropdownItemProps: {
                  children: "Import archive…",
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
              onSelect={(_e, tabKey) => setActiveTab(tabKey)}
              mountOnEnter
            >
              <Tab
                eventKey="details"
                title={<TabTitleText>Details</TabTitleText>}
              >
                <TabContentBody hasPadding>
                  <RepositoryDetailsTab
                    repository={repository}
                    pulpType={pulpType}
                    pulpDomain={pulpDomain}
                    onViewDistributions={() => setActiveTab("distributions")}
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
                  <RepositoryPublicationsTab repositoryHref={href} />
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
                  <RepositoryDistributionsTab repositoryHref={href} />
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
                    <pluginTab.Tab repository={repository} />
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

      <RepositoryModal
        isOpen={isEditOpen}
        entity={repository}
        onClose={() => setIsEditOpen(false)}
      />

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

      {isImportOpen && (
        <OstreeImportModal
          repository={repository}
          onClose={() => setIsImportOpen(false)}
          onStarted={contentChange.watch}
        />
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
