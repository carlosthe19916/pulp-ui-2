import { queryOptions, useQuery } from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type { PaginatedDistributionResponseList } from "@app/client";
import { distributionsList } from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

export const DistributionsQueryKey = "distributions";

type DistributionOrdering = NonNullable<
  Parameters<typeof distributionsList>[0]["query"]
>["ordering"];

interface DistributionListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<DistributionOrdering>[number];
  pulp_type?: NonNullable<
    Parameters<typeof distributionsList>[0]["query"]
  >["pulp_type"];
  name__icontains?: string;
  base_path__icontains?: string;
  repository?: string;
}

export const distributionsRootQueryOptions = queryOptions({
  queryKey: [DistributionsQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const distributionsListQueryOptions = (
  params: DistributionListParams = {},
) =>
  queryOptions({
    queryKey: [...distributionsRootQueryOptions.queryKey, "list", params],
    queryFn: async (): Promise<PaginatedDistributionResponseList> => {
      const response = await distributionsList({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        query: {
          limit: params.limit ?? 20,
          offset: params.offset,
          ordering: params.ordering ? [params.ordering] : undefined,
          pulp_type: params.pulp_type,
          name__icontains: params.name__icontains,
          base_path__icontains: params.base_path__icontains,
          repository: params.repository,
        },
      });
      if (!response.data) {
        throw new Error("Empty distributions list response");
      }
      return response.data;
    },
  });

export const useDistributionsListQuery = (
  params: DistributionListParams = {},
) => {
  return useQuery(distributionsListQueryOptions(params));
};
