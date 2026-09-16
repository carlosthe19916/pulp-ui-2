import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedGenericRemoteResponseList,
  RemotesListData,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const RemotesQueryKey = "remotes";

export type IRemoteListParams = ListParams<RemotesListData>;

export const remotesRootQueryOptions = queryOptions({
  queryKey: [RemotesQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const remotesListQueryOptions = (
  domain: IPulpDomain,
  params: IRemoteListParams = {},
) =>
  queryOptions({
    queryKey: [...remotesRootQueryOptions.queryKey, "list", domain, params],
    queryFn: async (): Promise<PaginatedGenericRemoteResponseList> => {
      const response =
        await axiosInstance.get<PaginatedGenericRemoteResponseList>(
          pulpApiPath("remotes/", domain),
          {
            params: {
              ...params,
              limit: params.limit ?? 20,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        );
      return response.data;
    },
  });

export const useRemotesListQuery = (params: IRemoteListParams = {}) => {
  const domain = useApiDomain();
  return useQuery(remotesListQueryOptions(domain, params));
};
