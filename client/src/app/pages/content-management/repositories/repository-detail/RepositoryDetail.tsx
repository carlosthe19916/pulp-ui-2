import type React from "react";
import { useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

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

import { getPlugin } from "@catalog";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { PublishModal } from "@app/components/PublishModal";
import { SyncModal } from "@app/components/SyncModal";
import { useNotifications } from "@app/hooks/useNotifications";
import { withId } from "@app/models/models";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { usePublicationsListQuery } from "@app/queries/publications";
import {
  useRepositoryDeleteMutation,
  useRepositoryVersionsListQuery,
  useSuspenseRepositoryDetailQuery,
} from "@app/queries/repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { RepositoryModal } from "../repository-list/components/RepositoryModal";
import { RepositoryDetailsTab } from "./components/RepositoryDetailsTab";
import { RepositoryDistributionsTab } from "./components/RepositoryDistributionsTab";
import { RepositoryPublicationsTab } from "./components/RepositoryPublicationsTab";
import { RepositoryVersionsTab } from "./components/RepositoryVersionsTab";

interface IRepositoryDetailProps {
  pulpDomain: string;
  pulpType: string;
  id: string;
}

export const RepositoryDetail: React.FC<IRepositoryDetailProps> = ({
  pulpDomain,
  pulpType,
  id,
}) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const { data: repository } = useSuspenseRepositoryDetailQuery({
    pulpType,
    id,
  });
  const href = repository.pulp_href ?? "";
  const apiPath = getPlugin(pulpType)?.entities.repository?.apiPath;
  const repoEntity = getPlugin(pulpType)?.entities.repository;
  const canSync = (repoEntity?.compatibleRemoteTypes.length ?? 0) > 0;
  const canPublish = (repoEntity?.compatiblePublicationTypes.length ?? 0) > 0;

  // Tab-title counts: one row each, read the paginated `count`.
  const { data: versionsCount } = useRepositoryVersionsListQuery({
    apiPath,
    id,
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
                },
              },
              canSync && {
                key: "sync",
                dropdownItemProps: {
                  children: "Sync",
                  onClick: () => setIsSyncOpen(true),
                },
              },
              canPublish && {
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
              <RepositoryDetailsTab
                repository={repository}
                pulpType={pulpType}
                pulpDomain={pulpDomain}
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
                apiPath={apiPath}
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
        </Tabs>
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
          repo={withId(id, repository)}
        />
      )}

      {isPublishOpen && (
        <PublishModal
          isOpen
          onClose={() => setIsPublishOpen(false)}
          repoHref={href}
        />
      )}

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title="Delete Repository"
        body={`Are you sure you want to delete repository "${repository.name}"? This action cannot be undone.`}
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(
            { href, name: repository.name ?? "" },
            { onSuccess: () => setIsDeleteOpen(false) },
          )
        }
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
