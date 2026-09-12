import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedGenericRemoteResponseList,
  RemotesListData,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { pulpApiPath } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const RemotesQueryKey = "remotes";

type RemoteQuery = NonNullable<RemotesListData["query"]>;

interface IRemoteListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<RemoteQuery["ordering"]>[number];
  pulp_type?: RemoteQuery["pulp_type"];
  name__icontains?: string;
}

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
              limit: params.limit ?? 20,
              offset: params.offset,
              ordering: params.ordering ? [params.ordering] : undefined,
              pulp_type: params.pulp_type,
              name__icontains: params.name__icontains,
            },
          },
        );
      if (!response.data) {
        throw new Error("Empty remotes list response");
      }
      return response.data;
    },
  });

export const useRemotesListQuery = (params: IRemoteListParams = {}) => {
  const domain = useApiDomain();
  return useQuery(remotesListQueryOptions(domain, params));
};
