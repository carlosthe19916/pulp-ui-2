import type { UseQueryOptions } from "@tanstack/react-query";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  ContainerRepositorySyncUrl,
  FileRepositorySyncUrl,
  PaginatedRepositoryResponseList,
  PaginatedRepositoryVersionResponseList,
  RemoveSignaturesResponse,
  RepositoriesFileFileVersionsListData,
  RepositoriesListData,
  RepositoryAddRemoveContent,
  RepositoryResponse,
  RepositorySyncUrl,
  RepositoryVersionResponse,
  RpmRepositorySyncUrl,
  TaskGroupOperationResponse,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { getPulpType } from "@catalog";

import { applyLabelChanges, type ILabelsChangeVariables } from "./labels";
import { taskKeys } from "./tasks";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath, pulpHref, toProxyHref } from "./utils/pulpApi";
import { parseRepositoryVersionHref, resolvePulpType } from "./utils/pulpHref";
import type { IBatchResult } from "./utils/settleBatch";

export const RepositoriesQueryKey = "repositories";

export type IRepositoryListParams = ListParams<RepositoriesListData>;

/**
 * Params for a repository's `versions/` list. Every plugin's `*VersionsListData` has the
 * same `query` block, so the File one stands in.
 */
export type IRepositoryVersionsListParams =
  ListParams<RepositoriesFileFileVersionsListData>;

/**
 * Query-key factory mirroring the REST paths; identifying segments precede params so a
 * prefix invalidates all variants.
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
};

type RepositoryListOptions = Omit<
  UseQueryOptions<PaginatedRepositoryResponseList, DrfAxiosError>,
  "queryKey" | "queryFn"
>;

export const repositoriesListQueryOptions = ({
  domain,
  params,
  options,
}: {
  domain: IPulpDomain;
  params: IRepositoryListParams;
  options?: RepositoryListOptions;
}) =>
  queryOptions<PaginatedRepositoryResponseList, DrfAxiosError>({
    ...options,
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
  options,
}: {
  params: IRepositoryListParams;
  options?: RepositoryListOptions;
}) => {
  const domain = useSelectedDomain();
  return useQuery(repositoriesListQueryOptions({ domain, params, options }));
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
 * Superset of every plugin's repository sync body: the base `remote`/`mirror` plus
 * optional plugin fields, derived from the generated types.
 */
export type RepositorySyncBody = RepositorySyncUrl &
  Partial<FileRepositorySyncUrl> &
  Partial<ContainerRepositorySyncUrl> &
  Partial<RpmRepositorySyncUrl>;

/**
 * Sync any repository: POSTs to its `sync/` action (202, one task); the body carries
 * `remote`/`mirror`.
 */
export const useRepositorySyncMutation = (
  options?: IMutationCallbacks<
    AsyncOperationResponse,
    { href: string; body: RepositorySyncBody }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    { href: string; body: RepositorySyncBody }
  >({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      body: RepositorySyncBody;
    }) => {
      const response = await axiosInstance.post<AsyncOperationResponse>(
        `${toProxyHref(href)}sync/`,
        body,
      );
      return response.data;
    },
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
      // Surface the new sync task on the row without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

/**
 * A plugin action's 2xx: one task (most actions), a task group (`/rpm/prune/`), or a
 * synchronous result (container `remove_signatures/` answers `200`).
 */
export type ActionOperationResponse =
  | AsyncOperationResponse
  | TaskGroupOperationResponse
  | RemoveSignaturesResponse;

export interface IRepositoryActionVariables {
  /** The repository or repository version the action runs on. */
  targetHref: string;
  /** Relative to `targetHref`, or a collection endpoint when it starts with `/`. */
  path: string;
  body: Record<string, unknown>;
}

/** The request body: multipart when it carries a file, JSON otherwise. */
const toActionBody = (body: Record<string, unknown>) => {
  const values = Object.values(body);
  if (!values.some((value) => value instanceof File)) {
    return body;
  }
  const form = new FormData();
  for (const [key, value] of Object.entries(body)) {
    if (value instanceof File) form.append(key, value);
    else if (typeof value === "object") form.append(key, JSON.stringify(value));
    else form.append(key, String(value));
  }
  return form;
};

/**
 * Runs a catalog repository action (sign, tag, copy…): one POST that starts a task, then
 * invalidates the repository.
 */
export const useRepositoryActionMutation = (
  options?: IMutationCallbacks<
    ActionOperationResponse,
    IRepositoryActionVariables
  >,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    ActionOperationResponse,
    DrfAxiosError,
    IRepositoryActionVariables
  >({
    mutationFn: async ({ targetHref, path, body }) => {
      const url = path.startsWith("/")
        ? pulpApiPath(path.slice(1), domain)
        : `${toProxyHref(targetHref)}${path}`;
      return (
        await axiosInstance.post<ActionOperationResponse>(
          url,
          toActionBody(body),
        )
      ).data;
    },
    onSuccess: (data, vars) => {
      const repositoryHref =
        parseRepositoryVersionHref(vars.targetHref)?.repositoryHref ??
        vars.targetHref;
      void queryClient.invalidateQueries({
        queryKey: repositoryKeys.detail(repositoryHref),
      });
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

/** The catalog's repository entity for a repository href. */
const repositoryEntity = (href: string) =>
  getPulpType(resolvePulpType(href) ?? "")?.entities.repository;

/**
 * Change a repository's content; every change creates a new version. Container
 * (`addRemove`) takes either adds or removes per call.
 */
export const useRepositoryModifyMutation = (
  options?: IMutationCallbacks<
    AsyncOperationResponse,
    { repository: RepositoryResponse; body: RepositoryAddRemoveContent }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    { repository: RepositoryResponse; body: RepositoryAddRemoveContent }
  >({
    mutationFn: async ({
      repository,
      body,
    }: {
      repository: RepositoryResponse;
      body: RepositoryAddRemoveContent;
    }) => {
      const href = repository.pulp_href ?? "";
      const entity = repositoryEntity(href);
      const base = toProxyHref(href);
      if (entity?.contentChanges === "addRemove") {
        const isRemove = !!body.remove_content_units?.length;
        const response = await axiosInstance.post<AsyncOperationResponse>(
          `${base}${isRemove ? "remove" : "add"}/`,
          {
            content_units: isRemove
              ? body.remove_content_units
              : body.add_content_units,
          },
        );
        return response.data;
      }
      const response = await axiosInstance.post<AsyncOperationResponse>(
        `${base}modify/`,
        body,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
      // Surface the new task (banner, row status) without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

/** The repository a version belongs to (server-form href), for invalidation. */
const parentRepositoryHref = (versionHref: string) =>
  parseRepositoryVersionHref(versionHref)?.repositoryHref ?? "";

/**
 * Deletes a repository version, returning the Pulp 202 task. Deleting the latest
 * makes the previous version the latest.
 */
export const useRepositoryVersionDeleteMutation = (
  options?: IMutationCallbacks<
    AsyncOperationResponse,
    RepositoryVersionResponse
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    RepositoryVersionResponse
  >({
    mutationFn: async (version: RepositoryVersionResponse) =>
      (
        await axiosInstance.delete<AsyncOperationResponse>(
          toProxyHref(version.pulp_href ?? ""),
        )
      ).data,
    onSuccess: (data, version) => {
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: repositoryKeys.detail(
          parentRepositoryHref(version.pulp_href ?? ""),
        ),
      });
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, version);
    },
    onError: options?.onError,
  });
};

/** Repairs a repository version (re-checks and re-downloads its artifacts). */
export const useRepositoryVersionRepairMutation = (
  options?: IMutationCallbacks<
    AsyncOperationResponse,
    RepositoryVersionResponse
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    RepositoryVersionResponse
  >({
    mutationFn: async (version: RepositoryVersionResponse) =>
      (
        await axiosInstance.post<AsyncOperationResponse>(
          `${toProxyHref(version.pulp_href ?? "")}repair/`,
          { verify_checksums: true },
        )
      ).data,
    onSuccess: (data, version) => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, version);
    },
    onError: options?.onError,
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
  getPulpType(pulpType)?.entities.repository?.apiPath;

export const buildRepositoryHref = (
  pulpType: string,
  id: string,
  domain: IPulpDomain,
): string | null => {
  const apiPath = repositoryApiPath(pulpType);
  return apiPath ? pulpHref(`repositories/${apiPath}/${id}/`, domain) : null;
};

export const buildRepositoryVersionHref = (
  repositoryHref: string,
  versionNumber: string,
): string => `${repositoryHref}versions/${versionNumber}/`;

export const useSuspenseRepositoryDetailQuery = ({ href }: { href: string }) =>
  useSuspenseQuery(repositoryDetailQueryOptions({ href }));

export const repositoryVersionDetailQueryOptions = ({
  href,
  options,
}: {
  href: string | null;
  options?: Omit<
    UseQueryOptions<RepositoryVersionResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<RepositoryVersionResponse, DrfAxiosError>({
    ...options,
    queryKey: repositoryKeys.versionDetail(href ?? ""),
    queryFn: async (): Promise<RepositoryVersionResponse> =>
      (
        await axiosInstance.get<RepositoryVersionResponse>(
          toProxyHref(href ?? ""),
        )
      ).data,
  });

export const useRepositoryVersionDetailQuery = ({
  href,
}: {
  href: string | null;
}) =>
  useQuery({
    ...repositoryVersionDetailQueryOptions({ href }),
    enabled: !!href,
  });

export const useSuspenseRepositoryVersionDetailQuery = ({
  href,
}: {
  href: string;
}) => useSuspenseQuery(repositoryVersionDetailQueryOptions({ href }));

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

/** Saves a diff of a repository's labels; refreshes that repository's detail. */
export const useRepositoryLabelsMutation = (
  options?: IMutationCallbacks<IBatchResult, ILabelsChangeVariables>,
) => {
  const queryClient = useQueryClient();
  return useMutation<IBatchResult, DrfAxiosError, ILabelsChangeVariables>({
    mutationFn: applyLabelChanges,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: repositoryKeys.detail(vars.href),
      });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};
