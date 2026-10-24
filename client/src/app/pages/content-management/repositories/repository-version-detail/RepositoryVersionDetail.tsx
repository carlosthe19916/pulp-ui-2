import type React from "react";
import { useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import {
  Alert,
  AlertActionLink,
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { RepositoryActionModal } from "@app/components/RepositoryActionModal";
import { getPlugin, type IRepositoryAction } from "@catalog";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { RepositoryContent } from "@app/components/RepositoryContent";
import { RepositoryTaskAlert } from "@app/components/RepositoryTaskAlert";
import { TableEmptyState } from "@app/components/TableEmptyState";
import {
  type VersionAction,
  VersionActionModal,
} from "@app/components/VersionActionModal";
import {
  useObjectPermissions,
  VERSION_ACTION_VERBS,
} from "@app/hooks/useObjectPermissions";
import { useRepositoryActivity } from "@app/hooks/useRepositoryActivity";
import {
  useRepositoryDetailQuery,
  useSuspenseRepositoryVersionDetailQuery,
} from "@app/queries/repositories";
import { summaryTotal } from "@app/utils/contentSummary";
import { latestVersionNumber } from "@app/utils/latestVersionNumber";

import { VersionVulnerabilityAlert } from "./components/VersionVulnerabilityAlert";

interface IRepositoryVersionDetailProps {
  pulpDomain: string;
  pulpType: string;
  id: string;
  versionNumber: string;
  repositoryHref: string;
  versionHref: string;
}

export const RepositoryVersionDetail: React.FC<
  IRepositoryVersionDetailProps
> = ({
  pulpDomain,
  pulpType,
  id,
  versionNumber,
  repositoryHref,
  versionHref,
}) => {
  const navigate = useNavigate();
  const { data: version } = useSuspenseRepositoryVersionDetailQuery({
    href: versionHref,
  });
  // Repo name for the breadcrumb (cached from navigation; optional).
  const { data: repository } = useRepositoryDetailQuery({
    href: repositoryHref,
  });
  const { contentChange, running, lockedProps } = useRepositoryActivity({
    repository,
  });
  const [action, setAction] = useState<VersionAction | null>(null);
  const [versionAction, setVersionAction] = useState<IRepositoryAction | null>(
    null,
  );
  const { disabledProps } = useObjectPermissions({ href: repositoryHref });

  const repositoryName = repository?.name ?? "Repository";
  const title = `Version ${version.number ?? versionNumber}`;
  const latestNumber = latestVersionNumber(repository);
  const isOlder =
    !!repository?.latest_version_href &&
    repository.latest_version_href !== version.pulp_href;
  const repoEntity = getPlugin(pulpType)?.entities.repository;
  const canRestore = repoEntity?.contentChanges === "modify";
  const versionActions = (repoEntity?.actions ?? []).filter(
    (item) => item.target === "version",
  );

  const repositoryParams = {
    pulpDomain,
    repositoryType: pulpType,
    repositoryId: id,
  };
  const goToLatest = () =>
    latestNumber &&
    void navigate({
      to: "/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/versions/$versionNumber",
      params: { ...repositoryParams, versionNumber: latestNumber },
    });
  const menuItem = ({ key, label }: { key: VersionAction; label: string }) => ({
    key,
    dropdownItemProps: {
      children: label,
      onClick: () => setAction(key),
      ...lockedProps,
      ...disabledProps(VERSION_ACTION_VERBS[key]),
    },
  });

  return (
    <>
      <DocumentTitle title={`${repositoryName} · ${title}`} />
      <PageHeader
        title={title}
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
            <BreadcrumbItem>
              <Link
                to="/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId"
                params={repositoryParams}
              >
                {repositoryName}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{title}</BreadcrumbItem>
          </Breadcrumb>
        }
        actionMenu={
          repository && (
            <PageHeaderActionsMenu
              actions={[
                canRestore &&
                  isOlder &&
                  menuItem({ key: "restore", label: "Restore as latest" }),
                menuItem({ key: "repair", label: "Repair version" }),
                version.number !== 0 &&
                  menuItem({ key: "delete", label: "Delete version" }),
                ...versionActions.map((item) => ({
                  key: `action-${item.key}`,
                  dropdownItemProps: {
                    children: `${item.label}…`,
                    description: item.description,
                    onClick: () => setVersionAction(item),
                    ...lockedProps,
                    ...disabledProps("modify"),
                  },
                })),
              ]}
            />
          )
        }
      />

      <PageSection>
        <Stack hasGutter>
          {repository && (running || contentChange.failure) && (
            <StackItem>
              <RepositoryTaskAlert
                repository={repository}
                running={running}
                failure={contentChange.failure}
                onCloseFailure={contentChange.clearFailure}
              />
            </StackItem>
          )}
          {versionActions.some((item) => item.key === "scan") && (
            <StackItem>
              <VersionVulnerabilityAlert
                pulpDomain={pulpDomain}
                versionHref={versionHref}
              />
            </StackItem>
          )}
          {isOlder && (
            <StackItem>
              <Alert
                variant="info"
                isInline
                title="Older version"
                actionLinks={
                  <AlertActionLink onClick={goToLatest}>
                    Go to version {latestNumber}
                  </AlertActionLink>
                }
              >
                Content changes apply to the latest version ({latestNumber}).
              </Alert>
            </StackItem>
          )}
          <StackItem>
            {summaryTotal(version.content_summary?.present) === 0 ? (
              <TableEmptyState title={`${title} has no content`} />
            ) : (
              <RepositoryContent
                repositoryHref={repositoryHref}
                repositoryType={pulpType}
                versionHref={version.pulp_href ?? ""}
                summary={version.content_summary}
              />
            )}
          </StackItem>
        </Stack>
      </PageSection>

      {versionAction && repository && (
        <RepositoryActionModal
          action={versionAction}
          repository={repository}
          targetHref={versionHref}
          onClose={() => setVersionAction(null)}
        />
      )}

      {action && repository && (
        <VersionActionModal
          action={action}
          version={version}
          repository={repository}
          onClose={() => setAction(null)}
          onRestoreStarted={contentChange.watch}
          onDeleted={() =>
            void navigate({
              to: "/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId",
              params: repositoryParams,
            })
          }
        />
      )}
    </>
  );
};
