import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedGenericRemoteResponseList,
  RemotesListData,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const RemotesQueryKey = "remotes";

export type IRemoteListParams = ListParams<RemotesListData>;

export const remotesRootQueryOptions = queryOptions({
  queryKey: [RemotesQueryKey],
  queryFn: async (): Promise<null> => null,
});

/**
 * Query-key factory mirroring the REST paths. Identifying segments precede
 * params so a prefix invalidates all variants of a collection. Shared by the
 * query options and the generic CRUD mutations (via `remotesRootQueryOptions`)
 * to prevent key drift.
 */
export const remoteKeys = {
  // --- invalidation folders (prefixes for invalidateQueries) ---
  // ["remotes"]
  all: () => [RemotesQueryKey] as const,
  // ["remotes", "list"] — every list query, any domain/params
  list: () => [...remoteKeys.all(), "list"] as const,
  // ["remotes", "detail", remoteHref]
  detail: (remoteHref: string) =>
    [...remoteKeys.all(), "detail", remoteHref] as const,

  // --- real query keys (for useQuery / queryOptions) ---
  // ["remotes", "list", domain, params]
  listQuery: (domain: IPulpDomain, params: IRemoteListParams) =>
    [...remoteKeys.list(), domain, params] as const,
  // ["remotes", "detail", remoteHref] — same value as detail() (no params)
  detailQuery: (remoteHref: string) => remoteKeys.detail(remoteHref),
};

export const remotesListQueryOptions = (
  domain: IPulpDomain,
  params: IRemoteListParams,
) =>
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

export const useRemotesListQuery = (params: IRemoteListParams) => {
  const domain = useSelectedDomain();
  return useQuery(remotesListQueryOptions(domain, params));
};
