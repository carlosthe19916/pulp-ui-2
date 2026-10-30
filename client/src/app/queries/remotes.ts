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
  GenericRemoteResponse,
  PaginatedGenericRemoteResponseList,
  RemotesListData,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { getPlugin } from "@catalog";

import { applyLabelChanges, type ILabelsChangeVariables } from "./labels";
import { taskKeys } from "./tasks";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath, pulpHref, toProxyHref } from "./utils/pulpApi";
import type { IBatchResult } from "./utils/settleBatch";

export const RemotesQueryKey = "remotes";

export type IRemoteListParams = ListParams<RemotesListData>;

/**
 * Query-key factory mirroring the REST paths; identifying segments precede params so a
 * prefix invalidates all variants.
 */
export const remoteKeys = {
  all: () => [RemotesQueryKey] as const,
  list: () => [...remoteKeys.all(), "list"] as const,
  detail: (remoteHref: string) =>
    [...remoteKeys.all(), "detail", remoteHref] as const,

  listQuery: (domain: IPulpDomain, params: IRemoteListParams) =>
    [...remoteKeys.list(), domain, params] as const,
  detailQuery: (remoteHref: string) => remoteKeys.detail(remoteHref),
};

type RemoteListOptions = Omit<
  UseQueryOptions<PaginatedGenericRemoteResponseList, DrfAxiosError>,
  "queryKey" | "queryFn"
>;

export const remotesListQueryOptions = ({
  domain,
  params,
  options,
}: {
  domain: IPulpDomain;
  params: IRemoteListParams;
  options?: RemoteListOptions;
}) =>
  queryOptions<PaginatedGenericRemoteResponseList, DrfAxiosError>({
    ...options,
    queryKey: remoteKeys.listQuery(domain, params),
    queryFn: async (): Promise<PaginatedGenericRemoteResponseList> => {
      const response =
        await axiosInstance.get<PaginatedGenericRemoteResponseList>(
          pulpApiPath("remotes/", domain),
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

export const useRemotesListQuery = ({
  params,
  options,
}: {
  params: IRemoteListParams;
  options?: RemoteListOptions;
}) => {
  const domain = useSelectedDomain();
  return useQuery(remotesListQueryOptions({ domain, params, options }));
};

/** Deletes a remote by `pulp_href`, returning the Pulp 202 task to track. */
export const useRemoteDeleteMutation = (
  options?: IMutationCallbacks<AsyncOperationResponse, GenericRemoteResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    GenericRemoteResponse
  >({
    mutationFn: async (
      remote: GenericRemoteResponse,
    ): Promise<AsyncOperationResponse> =>
      (
        await axiosInstance.delete<AsyncOperationResponse>(
          toProxyHref(remote.pulp_href ?? ""),
        )
      ).data,
    onSuccess: (data, remote) => {
      void queryClient.invalidateQueries({ queryKey: remoteKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: remoteKeys.detail(remote.pulp_href ?? ""),
      });
      // Surface the new delete task on the row without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, remote);
    },
    onError: options?.onError,
  });
};

/**
 * Detail-by-href for a remote (detail page, edit wizard, picker labels); the
 * `!!href` guard lives in the hook.
 */
export const remoteDetailQueryOptions = ({
  href,
  options,
}: {
  href: string | null;
  options?: Omit<
    UseQueryOptions<GenericRemoteResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<GenericRemoteResponse, DrfAxiosError>({
    ...options,
    queryKey: remoteKeys.detail(href ?? ""),
    queryFn: async (): Promise<GenericRemoteResponse> =>
      (await axiosInstance.get<GenericRemoteResponse>(toProxyHref(href ?? "")))
        .data,
  });

export const useRemoteDetailQuery = ({ href }: { href: string | null }) =>
  useQuery({
    ...remoteDetailQueryOptions({ href }),
    enabled: !!href,
  });

const remoteApiPath = (pulpType: string): string | undefined =>
  getPlugin(pulpType)?.entities.remote?.apiPath;

export const buildRemoteHref = (
  pulpType: string,
  id: string,
  domain: IPulpDomain,
): string | null => {
  const apiPath = remoteApiPath(pulpType);
  return apiPath ? pulpHref(`remotes/${apiPath}/${id}/`, domain) : null;
};

export const useSuspenseRemoteDetailQuery = ({ href }: { href: string }) =>
  useSuspenseQuery(remoteDetailQueryOptions({ href }));

/**
 * Creates a remote of the given plugin type: POSTs to the typed collection
 * `remotes/<apiPath>/` (apiPath from the catalog), returning the created remote.
 */
export const useRemoteCreateMutation = (
  options?: IMutationCallbacks<
    GenericRemoteResponse,
    { apiPath: string; body: Record<string, unknown> }
  >,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    GenericRemoteResponse,
    DrfAxiosError,
    { apiPath: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({
      apiPath,
      body,
    }: {
      apiPath: string;
      body: Record<string, unknown>;
    }): Promise<GenericRemoteResponse> =>
      (
        await axiosInstance.post<GenericRemoteResponse>(
          pulpApiPath(`remotes/${apiPath}/`, domain),
          body,
        )
      ).data,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: remoteKeys.list() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

/** PATCHes a remote by its own `pulp_href` (which embeds plugin + type). */
export const useRemoteUpdateMutation = (
  options?: IMutationCallbacks<
    GenericRemoteResponse | AsyncOperationResponse,
    { href: string; body: Record<string, unknown> }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    GenericRemoteResponse | AsyncOperationResponse,
    DrfAxiosError,
    { href: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      body: Record<string, unknown>;
    }): Promise<GenericRemoteResponse | AsyncOperationResponse> =>
      (
        await axiosInstance.patch<
          GenericRemoteResponse | AsyncOperationResponse
        >(toProxyHref(href), body)
      ).data,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: remoteKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: remoteKeys.detail(variables.href),
      });
      // Surface the new update task on the row without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

/** Saves a diff of a remote's labels; refreshes that remote's detail. */
export const useRemoteLabelsMutation = (
  options?: IMutationCallbacks<IBatchResult, ILabelsChangeVariables>,
) => {
  const queryClient = useQueryClient();
  return useMutation<IBatchResult, DrfAxiosError, ILabelsChangeVariables>({
    mutationFn: applyLabelChanges,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: remoteKeys.detail(vars.href),
      });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};
