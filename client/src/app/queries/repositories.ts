import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedRepositoryResponseList,
  RepositoriesListData,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const RepositoriesQueryKey = "repositories";

export type IRepositoryListParams = ListParams<RepositoriesListData>;

export const repositoriesRootQueryOptions = queryOptions({
  queryKey: [RepositoriesQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const repositoriesListQueryOptions = (
  domain: IPulpDomain,
  params: IRepositoryListParams,
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
            ...params,
            ordering: params.ordering ? [params.ordering] : undefined,
          },
        },
      );
      return response.data;
    },
  });

export const useRepositoriesListQuery = (params: IRepositoryListParams) => {
  const domain = useApiDomain();
  return useQuery(repositoriesListQueryOptions(domain, params));
};
