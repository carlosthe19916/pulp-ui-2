import type React from "react";

import { Link } from "@tanstack/react-router";

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  HelperText,
  HelperTextItem,
  List,
  ListItem,
  Skeleton,
} from "@patternfly/react-core";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text";

import type { RepositoryResponse } from "@app/client";
import { ContentUrlLink } from "@app/components/ContentUrlLink";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { TaskStateLabel } from "@app/components/TaskStateLabel";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  repositoryDistributionsPickerParams,
  useDistributionsListQuery,
} from "@app/queries/distributions";
import { usePublicationsListQuery } from "@app/queries/publications";
import { useRemoteDetailQuery } from "@app/queries/remotes";
import {
  useRepositoriesListQuery,
  useRepositoryVersionDetailQuery,
  useRepositoryVersionsListQuery,
} from "@app/queries/repositories";
import { useTasksListQuery } from "@app/queries/tasks";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { summaryTotal } from "@app/utils/contentSummary";
import { extractTaskId, shortTaskName } from "@app/utils/taskHref";
import { formatDateTime, getTaskErrorMessage } from "@app/utils/utils";

import { ToolReadError } from "../../components/ToolReadError";
import {
  distributionsByHrefParams,
  lastSyncParams,
  presentCounts,
  publicationApiPathOf,
  publicationsParams,
  repositoryByNameParams,
  servingHrefsOf,
  VERSIONS_COUNT_PARAMS,
} from "./repositoryStatusParams";

interface IFactProps {
  term: string;
  /** What the fact reads, for its loading and error text. */
  subject: string;
  /** The read behind it, when the card makes one for this fact. */
  query?: { isLoading: boolean; error: unknown };
  children: React.ReactNode;
}

/** One fact of the card, with its own loading and error state. */
const Fact: React.FC<IFactProps> = ({ term, subject, query, children }) => (
  <DescriptionListGroup>
    <DescriptionListTerm>{term}</DescriptionListTerm>
    <DescriptionListDescription>
      {query?.isLoading ? (
        <Skeleton width="10rem" screenreaderText={`Loading ${subject}`} />
      ) : query?.error ? (
        <ToolReadError
          error={query.error}
          action={`read ${subject}`}
          subject={subject}
        />
      ) : (
        children
      )}
    </DescriptionListDescription>
  </DescriptionListGroup>
);

interface IWarningProps {
  children: React.ReactNode;
}

const Warning: React.FC<IWarningProps> = ({ children }) => (
  <HelperText>
    <HelperTextItem variant="warning">{children}</HelperTextItem>
  </HelperText>
);

interface IRepositoryStatusCardProps {
  repository: RepositoryResponse;
}

const RepositoryStatusCard: React.FC<IRepositoryStatusCardProps> = ({
  repository,
}) => {
  const { name: pulpDomain } = useSelectedDomain();
  const href = repository.pulp_href ?? "";
  const pulpType = resolvePulpType(href);
  const publicationApiPath = publicationApiPathOf(href);
  const isPublished = !!publicationApiPath;

  const latestQuery = useRepositoryVersionDetailQuery({
    href: repository.latest_version_href ?? null,
  });
  const versionsQuery = useRepositoryVersionsListQuery({
    repositoryHref: href,
    params: VERSIONS_COUNT_PARAMS,
  });
  const syncsQuery = useTasksListQuery({
    params: lastSyncParams(repository.prn ?? ""),
    options: { enabled: !!repository.prn },
  });
  const publicationsQuery = usePublicationsListQuery({
    apiPath: publicationApiPath,
    params: publicationsParams(href),
    options: { enabled: isPublished },
  });
  const servingHrefs = servingHrefsOf(publicationsQuery.data);
  const viaPublicationsQuery = useDistributionsListQuery({
    params: distributionsByHrefParams(servingHrefs),
    options: { enabled: servingHrefs.length > 0 },
  });
  const distributionsQuery = useDistributionsListQuery({
    params: repositoryDistributionsPickerParams(href),
  });
  const remoteQuery = useRemoteDetailQuery({ href: repository.remote ?? null });

  const latest = latestQuery.data;
  const contentCounts = presentCounts(latest?.content_summary);
  const sync = syncsQuery.data?.results[0];
  const syncError = sync ? getTaskErrorMessage(sync) : undefined;
  const remote = remoteQuery.data;
  const serving = [
    ...(distributionsQuery.data?.results ?? []),
    ...(viaPublicationsQuery.data?.results ?? []),
  ];
  const servingQuery = {
    isLoading: distributionsQuery.isLoading || viaPublicationsQuery.isLoading,
    error: distributionsQuery.error ?? viaPublicationsQuery.error,
  };

  return (
    <Card isCompact>
      <CardHeader>
        <CardTitle component="h3">
          <Flex spaceItems={{ default: "spaceItemsSm" }}>
            <ResourceHrefLink
              kind="repository"
              href={href}
              label={repository.name}
            />
            {pulpType ? (
              <PulpTypeLabel pulpType={pulpType} entity="repository" />
            ) : null}
          </Flex>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <DescriptionList isCompact>
          <Fact
            term="Latest version"
            subject="the latest version"
            query={latestQuery}
          >
            <ResourceHrefLink
              kind="repositoryVersion"
              href={repository.latest_version_href}
            />
            {latest?.number === 0 ? (
              <Warning>Empty: nothing was added yet</Warning>
            ) : (
              <Content component="small">
                {summaryTotal(latest?.content_summary?.added)} added,{" "}
                {summaryTotal(latest?.content_summary?.removed)} removed in this
                version
              </Content>
            )}
          </Fact>
          {contentCounts.length > 0 ? (
            <Fact term="Content" subject="the content">
              <List isPlain>
                {contentCounts.map((entry) => (
                  <ListItem key={entry.pulpType}>
                    {entry.count.toLocaleString()} {entry.pulpType}
                  </ListItem>
                ))}
              </List>
            </Fact>
          ) : null}
          <Fact term="Versions" subject="the versions" query={versionsQuery}>
            {repository.retain_repo_versions
              ? `${versionsQuery.data?.count}, keeping the last ${repository.retain_repo_versions}`
              : `${versionsQuery.data?.count}, all kept`}
          </Fact>
          {isPublished ? (
            <Fact
              term="Publications"
              subject="the publications"
              query={publicationsQuery}
            >
              {publicationsQuery.data?.count ? (
                publicationsQuery.data.count
              ) : (
                <Warning>
                  None: its distributions serve nothing until it is published
                </Warning>
              )}
            </Fact>
          ) : null}
          <Fact
            term="Remote"
            subject="the remote"
            query={repository.remote ? remoteQuery : undefined}
          >
            {remote ? (
              <>
                <ResourceHrefLink
                  kind="remote"
                  href={repository.remote}
                  label={remote.name}
                />
                <Content component="small" className={textStyles.textBreakWord}>
                  {remote.url}
                  {remote.policy ? `, ${remote.policy}` : ""}
                  {remote.proxy_url ? `, through ${remote.proxy_url}` : ""}
                </Content>
                {remote.tls_validation === false ? (
                  <Warning>TLS validation is off</Warning>
                ) : null}
              </>
            ) : (
              "None"
            )}
          </Fact>
          {repository.prn ? (
            <Fact term="Last sync" subject="the sync tasks" query={syncsQuery}>
              {sync?.pulp_href ? (
                <>
                  <Flex spaceItems={{ default: "spaceItemsSm" }}>
                    <Link
                      to="/monitoring/$pulpDomain/tasks/$taskId"
                      params={{
                        pulpDomain,
                        taskId: extractTaskId(sync.pulp_href),
                      }}
                    >
                      {shortTaskName(sync.name)}
                    </Link>
                    <TaskStateLabel state={sync.state} isCompact />
                    <Content component="small">
                      {formatDateTime(sync.finished_at)}
                    </Content>
                  </Flex>
                  {syncError ? (
                    <Content component="p" className={textStyles.textBreakWord}>
                      {syncError}
                    </Content>
                  ) : null}
                </>
              ) : (
                "Never synced"
              )}
            </Fact>
          ) : null}
          <Fact
            term="Served by"
            subject="the distributions"
            query={servingQuery}
          >
            {serving.length > 0 ? (
              <List isPlain>
                {serving.map((distribution) => (
                  <ListItem key={distribution.pulp_href}>
                    <ResourceHrefLink
                      kind="distribution"
                      href={distribution.pulp_href}
                      label={distribution.name}
                    />{" "}
                    <ContentUrlLink distribution={distribution} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Warning>No distribution serves this repository</Warning>
            )}
          </Fact>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

interface IRepositoryStatusProps {
  name: string;
}

/** One repository's latest content, last sync, publications, remote and distributions. */
export const RepositoryStatus: React.FC<IRepositoryStatusProps> = ({
  name,
}) => {
  const { data, isLoading, error } = useRepositoriesListQuery({
    params: repositoryByNameParams(name),
  });

  if (isLoading) {
    return <Skeleton screenreaderText="Loading the repository" />;
  }
  if (error) {
    return (
      <ToolReadError
        error={error}
        action="read this repository"
        subject="the repository"
      />
    );
  }
  const repository = data?.results[0];
  if (!repository) {
    return (
      <Card isCompact>
        <CardHeader>
          <CardTitle component="h3">No repository is named "{name}"</CardTitle>
        </CardHeader>
      </Card>
    );
  }
  return <RepositoryStatusCard repository={repository} />;
};
