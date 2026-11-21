import { ToolCallStatus, useFrontendTool } from "@copilotkit/react-core/v2";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Skeleton } from "@patternfly/react-core";

import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  distributionsListQueryOptions,
  repositoryDistributionsPickerParams,
} from "@app/queries/distributions";
import { publicationsListQueryOptions } from "@app/queries/publications";
import { remoteDetailQueryOptions } from "@app/queries/remotes";
import {
  repositoriesListQueryOptions,
  repositoryVersionDetailQueryOptions,
  repositoryVersionsListQueryOptions,
} from "@app/queries/repositories";
import { tasksListQueryOptions } from "@app/queries/tasks";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { summaryTotal } from "@app/utils/contentSummary";

import { publishes } from "../publishes";
import { refuseForbidden } from "../refuseForbidden";
import { taskErrorForModel } from "../taskErrorForModel";
import { readSeparately, summarize } from "./readSeparately";
import { RepositoryStatus } from "./RepositoryStatus";
import {
  lastSyncParams,
  presentCounts,
  publicationsCountParams,
  repositoryByNameParams,
  VERSIONS_COUNT_PARAMS,
} from "./repositoryStatusParams";

const parameters = z.object({
  name: z
    .string()
    .describe(
      "The exact repository name; find it with showRepositories first if unsure",
    ),
});

/** Lets the assistant show one repository's content, last sync, remote and distributions. */
export const useRepositoryStatusTool = () => {
  const queryClient = useQueryClient();
  const domain = useSelectedDomain();

  useFrontendTool(
    {
      name: "showRepositoryStatus",
      description:
        "Show one repository's status: its latest version and content counts, its last sync and error, its publications, its remote's URL and policy, and the distributions serving it. Use it when a repository is empty, didn't sync, or isn't served.",
      parameters,
      handler: ({ name }) =>
        refuseForbidden({
          action: "read this repository",
          read: async () => {
            const page = await queryClient.query(
              repositoriesListQueryOptions({
                domain,
                params: repositoryByNameParams(name),
              }),
            );
            const repository = page.results[0];
            if (!repository?.pulp_href) {
              return { error: `No repository is named "${name}".` };
            }
            const href = repository.pulp_href;
            const isPublished = publishes(href);
            const [latest, versions, lastSync, publications, serving, remote] =
              await Promise.all([
                repository.latest_version_href
                  ? readSeparately(
                      queryClient.query(
                        repositoryVersionDetailQueryOptions({
                          href: repository.latest_version_href,
                        }),
                      ),
                    )
                  : undefined,
                readSeparately(
                  queryClient.query(
                    repositoryVersionsListQueryOptions({
                      repositoryHref: href,
                      params: VERSIONS_COUNT_PARAMS,
                    }),
                  ),
                ),
                repository.prn
                  ? readSeparately(
                      queryClient.query(
                        tasksListQueryOptions({
                          domain,
                          params: lastSyncParams(repository.prn),
                        }),
                      ),
                    )
                  : undefined,
                isPublished
                  ? readSeparately(
                      queryClient.query(
                        publicationsListQueryOptions({
                          domain,
                          params: publicationsCountParams(href),
                        }),
                      ),
                    )
                  : undefined,
                readSeparately(
                  queryClient.query(
                    distributionsListQueryOptions({
                      domain,
                      params: repositoryDistributionsPickerParams(href),
                    }),
                  ),
                ),
                repository.remote
                  ? readSeparately(
                      queryClient.query(
                        remoteDetailQueryOptions({ href: repository.remote }),
                      ),
                    )
                  : undefined,
              ]);
            return {
              type: resolvePulpType(href),
              latestVersion: summarize(latest, (version) => ({
                number: version.number,
                contentCounts: Object.fromEntries(
                  presentCounts(version.content_summary).map((entry) => [
                    entry.pulpType,
                    entry.count,
                  ]),
                ),
                added: summaryTotal(version.content_summary?.added),
                removed: summaryTotal(version.content_summary?.removed),
              })),
              versions: summarize(versions, (list) => list.count),
              retainRepoVersions: repository.retain_repo_versions,
              lastSync: summarize(lastSync, (list) => {
                const sync = list.results[0];
                return sync
                  ? {
                      state: sync.state,
                      finished: sync.finished_at,
                      error: taskErrorForModel(sync),
                    }
                  : "never synced";
              }),
              // Its distributions serve the latest publication, so none means 404.
              publications: summarize(publications, (list) => list.count),
              // The proxy stays out: its URL may carry credentials.
              remote:
                summarize(remote, (detail) => ({
                  name: detail.name,
                  url: detail.url,
                  policy: detail.policy,
                  tlsValidation: detail.tls_validation,
                })) ?? "none",
              // Distributions serving a specific version or publication aren't found by this filter.
              distributionsServingIt: summarize(serving, (list) =>
                list.results.map((distribution) => ({
                  name: distribution.name,
                  url: distribution.base_url,
                })),
              ),
            };
          },
        }),
      render: ({ args, status }) =>
        status === ToolCallStatus.InProgress || !args.name ? (
          <Skeleton screenreaderText="Looking up the repository" />
        ) : (
          <RepositoryStatus name={args.name} />
        ),
    },
    [queryClient, domain],
  );
};
