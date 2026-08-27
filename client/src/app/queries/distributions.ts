import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  DistributionsListData,
  PaginatedDistributionResponseList,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { pulpApiPath } from "./utils/pulpApi";
import type { PulpDomain } from "./utils/pulpApi";

export const DistributionsQueryKey = "distributions";

type DistributionQuery = NonNullable<DistributionsListData["query"]>;

export interface DistributionListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<DistributionQuery["ordering"]>[number];
  pulp_type?: DistributionQuery["pulp_type"];
  name__icontains?: string;
  base_path__icontains?: string;
  repository?: string;
}

export const distributionsRootQueryOptions = queryOptions({
  queryKey: [DistributionsQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const distributionsListQueryOptions = (
  domain: PulpDomain,
  params: DistributionListParams = {},
) =>
  queryOptions({
    queryKey: [
      ...distributionsRootQueryOptions.queryKey,
      "list",
      domain,
      params,
    ],
    queryFn: async (): Promise<PaginatedDistributionResponseList> => {
      const response =
        await axiosInstance.get<PaginatedDistributionResponseList>(
          pulpApiPath("distributions/", domain),
          {
            params: {
              limit: params.limit ?? 20,
              offset: params.offset,
              ordering: params.ordering ? [params.ordering] : undefined,
              pulp_type: params.pulp_type,
              name__icontains: params.name__icontains,
              base_path__icontains: params.base_path__icontains,
              repository: params.repository,
            },
          },
        );
      if (!response.data) {
        throw new Error("Empty distributions list response");
      }
      return response.data;
    },
  });

export const useDistributionsListQuery = (
  params: DistributionListParams = {},
) => {
  const domain = useApiDomain();
  return useQuery(distributionsListQueryOptions(domain, params));
};
