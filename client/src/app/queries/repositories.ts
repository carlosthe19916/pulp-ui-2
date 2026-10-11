import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  ContainerRepositorySyncUrl,
  FileRepositorySyncUrl,
  PaginatedRepositoryResponseList,
  PaginatedRepositoryVersionResponseList,
  RepositoriesFileFileVersionsListData,
  RepositoriesListData,
  RepositorySyncUrl,
  RepositoryVersionResponse,
  RpmRepositorySyncUrl,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { taskKeys } from "./tasks";
import { fetchAllPages } from "./utils/fetchAllPages";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
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

/** Deletes a repository by `pulp_href`, returning the Pulp 202 task to track. */
export const useRepositoryDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (href: string): Promise<AsyncOperationResponse> =>
      (await axiosInstance.delete<AsyncOperationResponse>(toProxyHref(href)))
        .data,
    onSuccess: (_data, href) => {
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: repositoryKeys.detail(href),
      });
      // Surface the new delete task on the row without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.entityOps() });
    },
  });
};

/**
 * Superset of every repository sync body. The `…/sync/` endpoint is uniform
 * across plugins (the path comes from the repository's own `pulp_href`); only
 * the body varies, and every plugin-specific field is optional and additive on
 * top of the base `remote`/`mirror`. Derived from the generated OpenAPI types so
 * regenerating the client surfaces any new `*RepositorySyncUrl` to fold in here.
 */
export type RepositorySyncBody = RepositorySyncUrl &
  Partial<FileRepositorySyncUrl> &
  Partial<ContainerRepositorySyncUrl> &
  Partial<RpmRepositorySyncUrl>;

/**
 * Sync any repository. Plugin-neutral but path-constructed (like
 * `useEntityCreateMutation`): rather than appending to the server-provided
 * `pulp_href`, the client rebuilds the exact endpoint from parts it already
 * knows — the `repositories/` family, the plugin's catalog `apiPath` (e.g.
 * `python/python`), the resource `id`, and the active domain — so the URL is
 * explicit and typed at the call site. One mutation serves every plugin; the body
 * carries only the universal `remote`/`mirror`.
 */
export const useRepositorySyncMutation = () => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      apiPath,
      id,
      body,
    }: {
      apiPath: string;
      id: string;
      body: RepositorySyncBody;
    }) => {
      const response = await axiosInstance.post<AsyncOperationResponse>(
        pulpApiPath(`repositories/${apiPath}/${id}/sync/`, domain),
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: repositoriesRootQueryOptions.queryKey,
      });
    },
  });
};

/**
 * Params for a repository's `versions/` list. The `versions` sub-resource is
 * plugin-neutral: every plugin's generated `*VersionsListData` has the same
 * `query` block (the only plugin-specific bit, the repository href, is a `path`
 * param that `ListParams` drops), so the File variant stands in as the canonical
 * spec source and stays in sync on `npm run generate`.
 */
export type IRepositoryVersionsListParams =
  ListParams<RepositoriesFileFileVersionsListData>;

const repositoryVersionsPath = (
  apiPath: string,
  id: string,
  domain: IPulpDomain,
) => pulpApiPath(`repositories/${apiPath}/${id}/versions/`, domain);

export const repositoryVersionsListQueryOptions = (
  apiPath: string | undefined,
  id: string,
  params: IRepositoryVersionsListParams,
  domain: IPulpDomain,
) =>
  queryOptions({
    queryKey: [
      ...repositoriesRootQueryOptions.queryKey,
      "versions",
      domain,
      apiPath,
      id,
      params,
    ],
    queryFn: async (): Promise<PaginatedRepositoryVersionResponseList> => {
      const response =
        await axiosInstance.get<PaginatedRepositoryVersionResponseList>(
          // `enabled` gates the fetch, so `apiPath ?? ""` is never hit at runtime.
          repositoryVersionsPath(apiPath ?? "", id, domain),
          {
            params: {
              ...params,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        );
      return response.data;
    },
    enabled: !!apiPath && !!id,
  });

/** Versions tab renders every version in one table (no pagination UI), so page through all. */
export const allRepositoryVersionsListQueryOptions = (
  apiPath: string | undefined,
  id: string,
  domain: IPulpDomain,
) =>
  queryOptions({
    queryKey: [
      ...repositoriesRootQueryOptions.queryKey,
      "versions",
      "all",
      domain,
      apiPath,
      id,
    ],
    queryFn: async (): Promise<PaginatedRepositoryVersionResponseList> => {
      const { results, count } = await fetchAllPages<RepositoryVersionResponse>(
        async (offset, limit) => {
          const response =
            await axiosInstance.get<PaginatedRepositoryVersionResponseList>(
              repositoryVersionsPath(apiPath ?? "", id, domain),
              { params: { offset, limit } },
            );
          return response.data;
        },
      );
      return { count, next: null, previous: null, results };
    },
    enabled: !!apiPath && !!id,
  });

export const useRepositoryVersionsListQuery = (
  apiPath: string | undefined,
  id: string,
  params: IRepositoryVersionsListParams,
) => {
  const domain = useSelectedDomain();
  return useQuery(
    repositoryVersionsListQueryOptions(apiPath, id, params, domain),
  );
};

export const useAllRepositoryVersionsListQuery = (
  apiPath: string | undefined,
  id: string,
) => {
  const domain = useSelectedDomain();
  return useQuery(allRepositoryVersionsListQueryOptions(apiPath, id, domain));
};
