import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  ContainerRepositorySyncUrl,
  FileRepositorySyncUrl,
  PaginatedRepositoryResponseList,
  PaginatedRepositoryVersionResponseList,
  RepositoriesFileFileVersionsListData,
  RepositoriesListData,
  RepositoryResponse,
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
 * Query-key factory mirroring the REST paths; identifying segments precede
 * params so a prefix invalidates all variants. Shared by the query options and
 * the generic CRUD mutations to prevent key drift.
 */
export const repositoryKeys = {
  all: () => [RepositoriesQueryKey] as const,
  list: () => [...repositoryKeys.all(), "list"] as const,
  detail: (repoHref: string) =>
    [...repositoryKeys.all(), "detail", repoHref] as const,

  listQuery: (domain: IPulpDomain, params: IRepositoryListParams) =>
    [...repositoryKeys.list(), domain, params] as const,
  detailQuery: (repoHref: string) => repositoryKeys.detail(repoHref),
};

export const repositoriesListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IRepositoryListParams;
}) =>
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

export const useRepositoriesListQuery = ({
  params,
}: {
  params: IRepositoryListParams;
}) => {
  const domain = useSelectedDomain();
  return useQuery(repositoriesListQueryOptions({ domain, params }));
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
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
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
 * `useRepositoryCreateMutation`): rather than appending to the server-provided
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

export const repositoryVersionsListQueryOptions = ({
  apiPath,
  id,
  params,
  domain,
  options,
}: {
  apiPath?: string;
  id: string;
  params: IRepositoryVersionsListParams;
  domain: IPulpDomain;
  options?: Omit<
    UseQueryOptions<PaginatedRepositoryVersionResponseList>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions({
    ...options,
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
          // The `use…Query` hook gates on `!!apiPath && !!id`, so `apiPath ?? ""`
          // is never hit at runtime.
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
  });

/** Versions tab renders every version in one table (no pagination UI), so page through all. */
export const allRepositoryVersionsListQueryOptions = ({
  apiPath,
  id,
  domain,
  options,
}: {
  apiPath?: string;
  id: string;
  domain: IPulpDomain;
  options?: Omit<
    UseQueryOptions<PaginatedRepositoryVersionResponseList>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions({
    ...options,
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
  });

export const useRepositoryVersionsListQuery = ({
  apiPath,
  id,
  params,
}: {
  apiPath?: string;
  id: string;
  params: IRepositoryVersionsListParams;
}) => {
  const domain = useSelectedDomain();
  return useQuery({
    ...repositoryVersionsListQueryOptions({ apiPath, id, params, domain }),
    enabled: !!apiPath && !!id,
  });
};

export const useAllRepositoryVersionsListQuery = ({
  apiPath,
  id,
}: {
  apiPath?: string;
  id: string;
}) => {
  const domain = useSelectedDomain();
  return useQuery({
    ...allRepositoryVersionsListQueryOptions({ apiPath, id, domain }),
    enabled: !!apiPath && !!id,
  });
};

/**
 * Detail-by-href for a repository, used to pre-fill the edit form and to resolve
 * a selected repository's label in resource pickers; keyed like the list detail
 * slot, with the `!!href` guard living in the hook.
 */
export const repositoryDetailQueryOptions = ({
  href,
  options,
}: {
  href: string | null;
  options?: Omit<UseQueryOptions<RepositoryResponse>, "queryKey" | "queryFn">;
}) =>
  queryOptions({
    ...options,
    queryKey: repositoryKeys.detail(href ?? ""),
    queryFn: async (): Promise<RepositoryResponse> =>
      (await axiosInstance.get<RepositoryResponse>(toProxyHref(href ?? "")))
        .data,
  });

export const useRepositoryDetailQuery = ({ href }: { href: string | null }) =>
  useQuery({
    ...repositoryDetailQueryOptions({ href }),
    enabled: !!href,
  });

/**
 * Creates a repository of the given plugin type: POSTs to `repositories/<apiPath>/`
 * (apiPath from the catalog), returning the created repository.
 */
export const useRepositoryCreateMutation = () => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      apiPath,
      body,
    }: {
      apiPath: string;
      body: Record<string, unknown>;
    }): Promise<RepositoryResponse> =>
      (
        await axiosInstance.post<RepositoryResponse>(
          pulpApiPath(`repositories/${apiPath}/`, domain),
          body,
        )
      ).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
    },
  });
};

/** PATCHes a repository by its own `pulp_href` (which embeds plugin + type). */
export const useRepositoryUpdateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      body: Record<string, unknown>;
    }): Promise<unknown> =>
      (await axiosInstance.patch(toProxyHref(href), body)).data,
    onSuccess: (_data, { href }) => {
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: repositoryKeys.detail(href),
      });
    },
  });
};
