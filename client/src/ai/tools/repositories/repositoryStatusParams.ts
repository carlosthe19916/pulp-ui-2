import type { ContentSummaryResponse } from "@app/client";
import { DROPDOWN_PAGE_SIZE } from "@app/constants";
import type { IDistributionListParams } from "@app/queries/distributions";
import type { IPublicationListParams } from "@app/queries/publications";
import type { IRepositoryListParams } from "@app/queries/repositories";
import type { ITaskListParams } from "@app/queries/tasks";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { summaryEntries } from "@app/utils/contentSummary";
import { getPulpType } from "@catalog";

/** Repository names are unique in a domain, so this finds one or none. */
export const repositoryByNameParams = (
  name: string,
): IRepositoryListParams => ({
  name,
  limit: 1,
});

/** The newest sync on the repository; plugins name it `…synchronize` or `…sync.sync`. */
export const lastSyncParams = (prn: string): ITaskListParams => ({
  reserved_resources: prn,
  name__contains: "sync",
  ordering: "-pulp_created",
  limit: 1,
  fields: ["pulp_href", "name", "state", "finished_at", "error"],
});

export const VERSIONS_COUNT_PARAMS = { limit: 1 } as const;

/** The typed publications endpoint of the repository's plugin; none when it doesn't publish. */
export const publicationApiPathOf = (repositoryHref: string) => {
  const publicationType = getPulpType(resolvePulpType(repositoryHref) ?? "")
    ?.entities.repository?.compatiblePublicationTypes[0];
  return publicationType
    ? getPulpType(publicationType)?.entities.publication?.apiPath
    : undefined;
};

/** Its newest publications; typed ones list the distributions serving them. */
export const publicationsParams = (
  repositoryHref: string,
): IPublicationListParams => ({
  repository: repositoryHref,
  ordering: "-pulp_created",
  limit: DROPDOWN_PAGE_SIZE,
  offset: 0,
});

/** The distributions serving any of these publications. */
export const servingHrefsOf = (
  publications: { results: unknown[] } | undefined,
) => [
  ...new Set(
    (publications?.results ?? []).flatMap(
      (publication) =>
        (publication as { distributions?: string[] }).distributions ?? [],
    ),
  ),
];

export const distributionsByHrefParams = (
  hrefs: string[],
): IDistributionListParams => ({
  pulp_href__in: hrefs,
  limit: hrefs.length,
});

/** The content types a version holds, with how many of each. */
export const presentCounts = (summary: ContentSummaryResponse | undefined) =>
  summaryEntries(summary?.present).filter((entry) => entry.count > 0);
