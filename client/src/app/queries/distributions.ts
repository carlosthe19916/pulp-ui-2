import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  DistributionsListData,
  PaginatedDistributionResponseList,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { taskKeys } from "./tasks";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const DistributionsQueryKey = "distributions";

export type IDistributionListParams = ListParams<DistributionsListData>;

export const distributionsRootQueryOptions = queryOptions({
  queryKey: [DistributionsQueryKey],
  queryFn: async (): Promise<null> => null,
});

/**
 * Query-key factory mirroring the REST paths. Identifying segments precede
 * params so a prefix invalidates all variants of a collection. Shared by the
 * query options and the generic CRUD mutations (via
 * `distributionsRootQueryOptions`) to prevent key drift.
 */
export const distributionKeys = {
  // --- invalidation folders (prefixes for invalidateQueries) ---
  // ["distributions"]
  all: () => [DistributionsQueryKey] as const,
  // ["distributions", "list"] — every list query, any domain/params
  list: () => [...distributionKeys.all(), "list"] as const,
  // ["distributions", "detail", distHref]
  detail: (distHref: string) =>
    [...distributionKeys.all(), "detail", distHref] as const,

  // --- real query keys (for useQuery / queryOptions) ---
  // ["distributions", "list", domain, params]
  listQuery: (domain: IPulpDomain, params: IDistributionListParams) =>
    [...distributionKeys.list(), domain, params] as const,
  // ["distributions", "detail", distHref] — same value as detail() (no params)
  detailQuery: (distHref: string) => distributionKeys.detail(distHref),
};

export const distributionsListQueryOptions = (
  domain: IPulpDomain,
  params: IDistributionListParams,
  options?: { enabled?: boolean },
) =>
  queryOptions({
    queryKey: distributionKeys.listQuery(domain, params),
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
  const domain = useSelectedDomain();
  return useQuery(distributionsListQueryOptions(domain, params, options));
};

/** Deletes a distribution by `pulp_href`, returning the Pulp 202 task to track. */
export const useDistributionDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (href: string): Promise<AsyncOperationResponse> =>
      (await axiosInstance.delete<AsyncOperationResponse>(toProxyHref(href)))
        .data,
    onSuccess: (_data, href) => {
      void queryClient.invalidateQueries({ queryKey: distributionKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: distributionKeys.detail(href),
      });
      // Surface the new delete task on the row without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.entityOps() });
    },
  });
};
