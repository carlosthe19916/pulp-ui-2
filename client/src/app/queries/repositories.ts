import { queryOptions, useQuery } from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type { PaginatedRepositoryResponseList } from "@app/client";
import { repositoriesList } from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

export const RepositoriesQueryKey = "repositories";

type RepositoryOrdering = NonNullable<
  Parameters<typeof repositoriesList>[0]["query"]
>["ordering"];

interface RepositoryListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<RepositoryOrdering>[number];
  pulp_type?: NonNullable<
    Parameters<typeof repositoriesList>[0]["query"]
  >["pulp_type"];
  name__icontains?: string;
}

export const repositoriesRootQueryOptions = queryOptions({
  queryKey: [RepositoriesQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const repositoriesListQueryOptions = (
  params: RepositoryListParams = {},
) =>
  queryOptions({
    queryKey: [...repositoriesRootQueryOptions.queryKey, "list", params],
    queryFn: async (): Promise<PaginatedRepositoryResponseList> => {
      const response = await repositoriesList({
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
        throw new Error("Empty repositories list response");
      }
      return response.data;
    },
  });

export const useRepositoriesListQuery = (params: RepositoryListParams = {}) => {
  return useQuery(repositoriesListQueryOptions(params));
};
