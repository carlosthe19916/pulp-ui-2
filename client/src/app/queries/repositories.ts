import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedRepositoryResponseList,
  RepositoriesListData,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { pulpApiPath } from "./utils/pulpApi";
import type { PulpDomain } from "./utils/pulpApi";

export const RepositoriesQueryKey = "repositories";

type RepositoryQuery = NonNullable<RepositoriesListData["query"]>;

interface RepositoryListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<RepositoryQuery["ordering"]>[number];
  pulp_type?: RepositoryQuery["pulp_type"];
  name__icontains?: string;
}

export const repositoriesRootQueryOptions = queryOptions({
  queryKey: [RepositoriesQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const repositoriesListQueryOptions = (
  domain: PulpDomain,
  params: RepositoryListParams = {},
) =>
  queryOptions({
    queryKey: [
      ...repositoriesRootQueryOptions.queryKey,
      "list",
      domain,
      params,
    ],
    queryFn: async (): Promise<PaginatedRepositoryResponseList> => {
      const response = await axiosInstance.get<PaginatedRepositoryResponseList>(
        pulpApiPath("repositories/", domain),
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
        throw new Error("Empty repositories list response");
      }
      return response.data;
    },
  });

export const useRepositoriesListQuery = (params: RepositoryListParams = {}) => {
  const domain = useApiDomain();
  return useQuery(repositoriesListQueryOptions(domain, params));
};
