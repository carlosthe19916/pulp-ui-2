import type { ContentSummaryResponse } from "@app/client";
import type { IPublicationListParams } from "@app/queries/publications";
import type { IRepositoryListParams } from "@app/queries/repositories";
import type { ITaskListParams } from "@app/queries/tasks";
import { summaryEntries } from "@app/utils/contentSummary";

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

export const publicationsCountParams = (
  repositoryHref: string,
): IPublicationListParams => ({ repository: repositoryHref, limit: 1 });

/** The content types a version holds, with how many of each. */
export const presentCounts = (summary: ContentSummaryResponse | undefined) =>
  summaryEntries(summary?.present).filter((entry) => entry.count > 0);
