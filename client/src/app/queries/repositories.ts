import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedRepositoryResponseList,
  RepositoriesListData,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const RepositoriesQueryKey = "repositories";

export type IRepositoryListParams = ListParams<RepositoriesListData>;

export const repositoriesRootQueryOptions = queryOptions({
  queryKey: [RepositoriesQueryKey],
  queryFn: async (): Promise<null> => null,
});

/**
 * Query-key factory mirroring the REST paths. Identifying segments precede
 * params so a prefix invalidates all variants of a collection. Shared by the
 * query options and the generic CRUD mutations (via
 * `repositoriesRootQueryOptions`) to prevent key drift.
 */
export const repositoryKeys = {
  // --- invalidation folders (prefixes for invalidateQueries) ---
  // ["repositories"]
  all: () => [RepositoriesQueryKey] as const,
  // ["repositories", "list"] — every list query, any domain/params
  list: () => [...repositoryKeys.all(), "list"] as const,
  // ["repositories", "detail", repoHref]
  detail: (repoHref: string) =>
    [...repositoryKeys.all(), "detail", repoHref] as const,

  // --- real query keys (for useQuery / queryOptions) ---
  // ["repositories", "list", domain, params]
  listQuery: (domain: IPulpDomain, params: IRepositoryListParams) =>
    [...repositoryKeys.list(), domain, params] as const,
  // ["repositories", "detail", repoHref] — same value as detail() (no params)
  detailQuery: (repoHref: string) => repositoryKeys.detail(repoHref),
};

export const repositoriesListQueryOptions = (
  domain: IPulpDomain,
  params: IRepositoryListParams,
) =>
  queryOptions({
    queryKey: repositoryKeys.listQuery(domain, params),
    queryFn: async (): Promise<PaginatedRepositoryResponseList> => {
      const response = await axiosInstance.get<PaginatedRepositoryResponseList>(
        pulpApiPath("repositories/", domain),
        {
          params: {
            ...params,
            ordering: params.ordering ? [params.ordering] : undefined,
          },
        },
      );
      return response.data;
    },
  });

export const useRepositoriesListQuery = (params: IRepositoryListParams) => {
  const domain = useSelectedDomain();
  return useQuery(repositoriesListQueryOptions(domain, params));
};
