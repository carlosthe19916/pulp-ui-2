import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  DistributionsListData,
  PaginatedDistributionResponseList,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const DistributionsQueryKey = "distributions";

export type IDistributionListParams = ListParams<DistributionsListData>;

export const distributionsRootQueryOptions = queryOptions({
  queryKey: [DistributionsQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const distributionsListQueryOptions = (
  domain: IPulpDomain,
  params: IDistributionListParams,
  options?: { enabled?: boolean },
) =>
  queryOptions({
    queryKey: [
      ...distributionsRootQueryOptions.queryKey,
      "list",
      domain,
      params,
    ],
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<PaginatedDistributionResponseList> => {
      const response =
        await axiosInstance.get<PaginatedDistributionResponseList>(
          pulpApiPath("distributions/", domain),
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

export const useDistributionsListQuery = (
  params: IDistributionListParams,
  options?: { enabled?: boolean },
) => {
  const domain = useApiDomain();
  return useQuery(distributionsListQueryOptions(domain, params, options));
};
