import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  DistributionResponse,
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

/**
 * Query-key factory mirroring the REST paths; identifying segments precede
 * params so a prefix invalidates all variants. Shared by the query options and
 * the generic CRUD mutations to prevent key drift.
 */
export const distributionKeys = {
  all: () => [DistributionsQueryKey] as const,
  list: () => [...distributionKeys.all(), "list"] as const,
  detail: (distHref: string) =>
    [...distributionKeys.all(), "detail", distHref] as const,

  listQuery: (domain: IPulpDomain, params: IDistributionListParams) =>
    [...distributionKeys.list(), domain, params] as const,
  detailQuery: (distHref: string) => distributionKeys.detail(distHref),
};

export const distributionsListQueryOptions = ({
  domain,
  params,
  options,
}: {
  domain: IPulpDomain;
  params: IDistributionListParams;
  options?: Omit<
    UseQueryOptions<PaginatedDistributionResponseList>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions({
    ...options,
    queryKey: distributionKeys.listQuery(domain, params),
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

export const useDistributionsListQuery = ({
  params,
  options,
}: {
  params: IDistributionListParams;
  options?: Omit<
    UseQueryOptions<PaginatedDistributionResponseList>,
    "queryKey" | "queryFn"
  >;
}) => {
  const domain = useSelectedDomain();
  return useQuery(distributionsListQueryOptions({ domain, params, options }));
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
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
    },
  });
};

/**
 * Caller-tunable slice of the query config: everything `useQuery`/`queryOptions`
 * accept except the two fields this module owns (`queryKey`, `queryFn`).
 */
type DistributionDetailOptions = Omit<
  UseQueryOptions<DistributionResponse>,
  "queryKey" | "queryFn"
>;

/**
 * Detail-by-href for a distribution, used to pre-fill the edit form; keyed like
 * the list detail slot, with the `!!href` guard living in the hook.
 */
export const distributionDetailQueryOptions = ({
  href,
  options,
}: {
  href: string | null;
  options?: DistributionDetailOptions;
}) =>
  queryOptions({
    ...options,
    queryKey: distributionKeys.detail(href ?? ""),
    queryFn: async (): Promise<DistributionResponse> =>
      (await axiosInstance.get<DistributionResponse>(toProxyHref(href ?? "")))
        .data,
  });

export const useDistributionDetailQuery = ({ href }: { href: string | null }) =>
  useQuery({
    ...distributionDetailQueryOptions({ href }),
    enabled: !!href,
  });

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
