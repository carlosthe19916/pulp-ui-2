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
  GenericRemoteResponse,
  PaginatedGenericRemoteResponseList,
  RemotesListData,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { taskKeys } from "./tasks";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const RemotesQueryKey = "remotes";

export type IRemoteListParams = ListParams<RemotesListData>;

/**
 * Query-key factory mirroring the REST paths; identifying segments precede
 * params so a prefix invalidates all variants. Shared by the query options and
 * the generic CRUD mutations to prevent key drift.
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

export const remotesListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IRemoteListParams;
}) =>
  queryOptions({
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
}: {
  params: IRemoteListParams;
}) => {
  const domain = useSelectedDomain();
  return useQuery(remotesListQueryOptions({ domain, params }));
};

/** Deletes a remote by `pulp_href`, returning the Pulp 202 task to track. */
export const useRemoteDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (href: string): Promise<AsyncOperationResponse> =>
      (await axiosInstance.delete<AsyncOperationResponse>(toProxyHref(href)))
        .data,
    onSuccess: (_data, href) => {
      void queryClient.invalidateQueries({ queryKey: remoteKeys.list() });
      void queryClient.invalidateQueries({ queryKey: remoteKeys.detail(href) });
      // Surface the new delete task on the row without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
    },
  });
};

/**
 * Detail-by-href for a remote, used to pre-fill the edit wizard and to resolve a
 * selected remote's label in resource pickers; keyed like the list detail slot,
 * with the `!!href` guard living in the hook.
 */
export const remoteDetailQueryOptions = ({
  href,
  options,
}: {
  href: string | null;
  options?: Omit<
    UseQueryOptions<GenericRemoteResponse>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions({
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

/**
 * Creates a remote of the given plugin type: POSTs to the typed collection
 * `remotes/<apiPath>/` (apiPath from the catalog), returning the created remote.
 */
export const useRemoteCreateMutation = () => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation({
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: remoteKeys.list() });
    },
  });
};

/** PATCHes a remote by its own `pulp_href` (which embeds plugin + type). */
export const useRemoteUpdateMutation = () => {
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
      void queryClient.invalidateQueries({ queryKey: remoteKeys.list() });
      void queryClient.invalidateQueries({ queryKey: remoteKeys.detail(href) });
    },
  });
};
