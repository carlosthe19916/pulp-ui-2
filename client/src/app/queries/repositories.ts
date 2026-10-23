import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

import { getPlugin } from "@catalog";
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
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath, pulpHref, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const RepositoriesQueryKey = "repositories";

export type IRepositoryListParams = ListParams<RepositoriesListData>;

/**
 * Params for a repository's `versions/` list. The `versions` sub-resource is
 * plugin-neutral: every plugin's generated `*VersionsListData` has the same
 * `query` block (the only plugin-specific bit, the repository href, is a `path`
 * param that `ListParams` drops), so the File variant stands in as the canonical
 * spec source and stays in sync on `npm run generate`.
 */
export type IRepositoryVersionsListParams =
  ListParams<RepositoriesFileFileVersionsListData>;

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
  versions: (repoHref: string) =>
    [...repositoryKeys.detail(repoHref), "versions"] as const,
  // Versions are immutable, so a version's detail is keyed by its own href alone.
  versionDetail: (versionHref: string) =>
    [...repositoryKeys.all(), "version", versionHref] as const,

  listQuery: (domain: IPulpDomain, params: IRepositoryListParams) =>
    [...repositoryKeys.list(), domain, params] as const,
  detailQuery: (repoHref: string) => repositoryKeys.detail(repoHref),
  versionsQuery: (repoHref: string, params: IRepositoryVersionsListParams) =>
    [...repositoryKeys.versions(repoHref), params] as const,
  subResourceQuery: (repoHref: string, path: string, params: object) =>
    [...repositoryKeys.detail(repoHref), path, params] as const,
};

export const repositoriesListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IRepositoryListParams;
}) =>
  queryOptions<PaginatedRepositoryResponseList, DrfAxiosError>({
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
export const useRepositoryDeleteMutation = (
  options?: IMutationCallbacks<AsyncOperationResponse, RepositoryResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation<AsyncOperationResponse, DrfAxiosError, RepositoryResponse>(
    {
      mutationFn: async (
        repository: RepositoryResponse,
      ): Promise<AsyncOperationResponse> =>
        (
          await axiosInstance.delete<AsyncOperationResponse>(
            toProxyHref(repository.pulp_href ?? ""),
          )
        ).data,
      onSuccess: (data, repository) => {
        void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
        void queryClient.invalidateQueries({
          queryKey: repositoryKeys.detail(repository.pulp_href ?? ""),
        });
        // Surface the new delete task on the row without waiting for the next poll.
        void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
        options?.onSuccess?.(data, repository);
      },
      onError: options?.onError,
    },
  );
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
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    { apiPath: string; id: string; body: RepositorySyncBody }
  >({
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
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
      // Surface the new sync task on the row without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
    },
  });
};

export const repositoryVersionsListQueryOptions = ({
  repositoryHref,
  params,
  options,
}: {
  repositoryHref: string;
  params: IRepositoryVersionsListParams;
  options?: Omit<
    UseQueryOptions<PaginatedRepositoryVersionResponseList, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<PaginatedRepositoryVersionResponseList, DrfAxiosError>({
    ...options,
    queryKey: repositoryKeys.versionsQuery(repositoryHref, params),
    queryFn: async (): Promise<PaginatedRepositoryVersionResponseList> => {
      const response =
        await axiosInstance.get<PaginatedRepositoryVersionResponseList>(
          `${toProxyHref(repositoryHref)}versions/`,
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

export const useRepositoryVersionsListQuery = ({
  repositoryHref,
  params,
  options,
}: {
  repositoryHref: string;
  params: IRepositoryVersionsListParams;
  options?: Omit<
    UseQueryOptions<PaginatedRepositoryVersionResponseList, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  useQuery({
    ...repositoryVersionsListQueryOptions({ repositoryHref, params, options }),
    enabled: !!repositoryHref && options?.enabled !== false,
  });

/**
 * A plugin's read-only sub-resource of a repository (`{href}<path>`, e.g. Maven
 * `packages/` or `metrics/`). The caller passes the generated response and query
 * types; the key nests under the repository's detail so a sync refreshes it.
 */
export const repositorySubResourceQueryOptions = <
  TData,
  TParams extends object,
>({
  repositoryHref,
  path,
  params,
  options,
}: {
  repositoryHref: string;
  path: string;
  params: TParams;
  options?: Omit<UseQueryOptions<TData, DrfAxiosError>, "queryKey" | "queryFn">;
}) =>
  queryOptions<TData, DrfAxiosError>({
    ...options,
    queryKey: repositoryKeys.subResourceQuery(repositoryHref, path, params),
    queryFn: async (): Promise<TData> =>
      (
        await axiosInstance.get<TData>(
          `${toProxyHref(repositoryHref)}${path}`,
          { params },
        )
      ).data,
  });

export const useRepositorySubResourceQuery = <TData, TParams extends object>({
  repositoryHref,
  path,
  params,
  options,
}: {
  repositoryHref: string;
  path: string;
  params: TParams;
  options?: Omit<UseQueryOptions<TData, DrfAxiosError>, "queryKey" | "queryFn">;
}) =>
  useQuery({
    ...repositorySubResourceQueryOptions<TData, TParams>({
      repositoryHref,
      path,
      params,
      options,
    }),
    enabled: !!repositoryHref && options?.enabled !== false,
  });

/**
 * Detail-by-href for a repository (detail page, edit form, picker labels); the
 * `!!href` guard lives in the hook.
 */
export const repositoryDetailQueryOptions = ({
  href,
  options,
}: {
  href: string | null;
  options?: Omit<
    UseQueryOptions<RepositoryResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<RepositoryResponse, DrfAxiosError>({
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

const repositoryApiPath = (pulpType: string): string | undefined =>
  getPlugin(pulpType)?.entities.repository?.apiPath;

export const buildRepositoryHref = (
  pulpType: string,
  id: string,
  domain: IPulpDomain,
): string | null => {
  const apiPath = repositoryApiPath(pulpType);
  return apiPath ? pulpHref(`repositories/${apiPath}/${id}/`, domain) : null;
};

export const useSuspenseRepositoryDetailQuery = ({ href }: { href: string }) =>
  useSuspenseQuery(repositoryDetailQueryOptions({ href }));

export const repositoryVersionDetailQueryOptions = ({
  versionHref,
}: {
  versionHref: string | null;
}) =>
  queryOptions<RepositoryVersionResponse, DrfAxiosError>({
    queryKey: repositoryKeys.versionDetail(versionHref ?? ""),
    queryFn: async (): Promise<RepositoryVersionResponse> =>
      (
        await axiosInstance.get<RepositoryVersionResponse>(
          toProxyHref(versionHref ?? ""),
        )
      ).data,
  });

export const useRepositoryVersionDetailQuery = ({
  href,
}: {
  href: string | null;
}) =>
  useQuery({
    ...repositoryVersionDetailQueryOptions({ versionHref: href }),
    enabled: !!href,
  });

export const useSuspenseRepositoryVersionDetailQuery = ({
  href,
}: {
  href: string;
}) =>
  useSuspenseQuery(repositoryVersionDetailQueryOptions({ versionHref: href }));

/**
 * Creates a repository of the given plugin type: POSTs to `repositories/<apiPath>/`
 * (apiPath from the catalog), returning the created repository.
 */
export const useRepositoryCreateMutation = (
  options?: IMutationCallbacks<
    RepositoryResponse,
    { apiPath: string; body: Record<string, unknown> }
  >,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    RepositoryResponse,
    DrfAxiosError,
    { apiPath: string; body: Record<string, unknown> }
  >({
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
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

/** PATCHes a repository by its own `pulp_href` (which embeds plugin + type). */
export const useRepositoryUpdateMutation = (
  options?: IMutationCallbacks<
    RepositoryResponse | AsyncOperationResponse,
    { href: string; body: Record<string, unknown> }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    RepositoryResponse | AsyncOperationResponse,
    DrfAxiosError,
    { href: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      body: Record<string, unknown>;
    }): Promise<RepositoryResponse | AsyncOperationResponse> =>
      (
        await axiosInstance.patch<RepositoryResponse | AsyncOperationResponse>(
          toProxyHref(href),
          body,
        )
      ).data,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: repositoryKeys.detail(variables.href),
      });
      // Surface the new update task on the row without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};
