import { queryOptions, useQuery } from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type { PaginatedGenericRemoteResponseList } from "@app/client";
import { remotesList } from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

export const RemotesQueryKey = "remotes";

type RemoteOrdering = NonNullable<
  Parameters<typeof remotesList>[0]["query"]
>["ordering"];

interface RemoteListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<RemoteOrdering>[number];
  pulp_type?: NonNullable<
    Parameters<typeof remotesList>[0]["query"]
  >["pulp_type"];
  name__icontains?: string;
}

export const remotesRootQueryOptions = queryOptions({
  queryKey: [RemotesQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const remotesListQueryOptions = (params: RemoteListParams = {}) =>
  queryOptions({
    queryKey: [...remotesRootQueryOptions.queryKey, "list", params],
    queryFn: async (): Promise<PaginatedGenericRemoteResponseList> => {
      const response = await remotesList({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        query: {
          limit: params.limit ?? 20,
          offset: params.offset,
          ordering: params.ordering ? [params.ordering] : undefined,
          pulp_type: params.pulp_type,
          name__icontains: params.name__icontains,
        },
      });
      if (!response.data) {
        throw new Error("Empty remotes list response");
      }
      return response.data;
    },
  });

export const useRemotesListQuery = (params: RemoteListParams = {}) => {
  return useQuery(remotesListQueryOptions(params));
};
