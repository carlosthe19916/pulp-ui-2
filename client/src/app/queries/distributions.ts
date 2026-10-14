import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  DistributionResponse,
  DistributionsListData,
  PaginatedDistributionResponseList,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
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
    },
  });
};

/**
 * Detail-by-href for a distribution (non-suspense), used to pre-fill the edit form.
 * Keyed the same as the list detail slot so the cache stays unified. Disabled until
 * an href is present.
 */
export const distributionDetailQueryOptions = (href: string | null) =>
  queryOptions({
    queryKey: distributionKeys.detail(href ?? ""),
    queryFn: async (): Promise<DistributionResponse> =>
      (await axiosInstance.get<DistributionResponse>(toProxyHref(href ?? "")))
        .data,
    enabled: !!href,
  });

export const useDistributionDetailQuery = (href: string | null) =>
  useQuery(distributionDetailQueryOptions(href));

/**
 * Creates a distribution of the given plugin type: POSTs to `distributions/<apiPath>/`
 * (apiPath from the catalog). Distribution creation is asynchronous, so it returns the
 * Pulp 202 task.
 */
export const useDistributionCreateMutation = () => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      apiPath,
      body,
    }: {
      apiPath: string;
      body: Record<string, unknown>;
    }): Promise<AsyncOperationResponse> =>
      (
        await axiosInstance.post<AsyncOperationResponse>(
          pulpApiPath(`distributions/${apiPath}/`, domain),
          body,
        )
      ).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: distributionKeys.list() });
    },
  });
};

/** PATCHes a distribution by its own `pulp_href` (which embeds plugin + type). */
export const useDistributionUpdateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      body: Record<string, unknown>;
    }): Promise<unknown> =>
      (await axiosInstance.patch(toProxyHref(href), body)).data,
    onSuccess: (_data, { href }) => {
      void queryClient.invalidateQueries({ queryKey: distributionKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: distributionKeys.detail(href),
      });
    },
  });
};
