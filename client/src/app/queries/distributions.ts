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
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
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

  listQuery: (
    domain: IPulpDomain,
    params: IDistributionListParams,
    apiPath?: string,
  ) => [...distributionKeys.list(), domain, apiPath, params] as const,
  detailQuery: (distHref: string) => distributionKeys.detail(distHref),
};

/**
 * Lists distributions: the cross-type aggregate by default, or one plugin's typed
 * collection when `apiPath` is given (the aggregate omits plugin fields like
 * `publication`).
 */
export const distributionsListQueryOptions = ({
  domain,
  apiPath,
  params,
  options,
}: {
  domain: IPulpDomain;
  apiPath?: string;
  params: IDistributionListParams;
  options?: Omit<
    UseQueryOptions<PaginatedDistributionResponseList, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<PaginatedDistributionResponseList, DrfAxiosError>({
    ...options,
    queryKey: distributionKeys.listQuery(domain, params, apiPath),
    queryFn: async (): Promise<PaginatedDistributionResponseList> => {
      const response =
        await axiosInstance.get<PaginatedDistributionResponseList>(
          pulpApiPath(
            apiPath ? `distributions/${apiPath}/` : "distributions/",
            domain,
          ),
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
  apiPath,
  params,
  options,
}: {
  apiPath?: string;
  params: IDistributionListParams;
  options?: Omit<
    UseQueryOptions<PaginatedDistributionResponseList, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) => {
  const domain = useSelectedDomain();
  return useQuery(
    distributionsListQueryOptions({ domain, apiPath, params, options }),
  );
};

/** Deletes a distribution by `pulp_href`, returning the Pulp 202 task to track. */
export const useDistributionDeleteMutation = (
  options?: IMutationCallbacks<AsyncOperationResponse, DistributionResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    DistributionResponse
  >({
    mutationFn: async (
      distribution: DistributionResponse,
    ): Promise<AsyncOperationResponse> =>
      (
        await axiosInstance.delete<AsyncOperationResponse>(
          toProxyHref(distribution.pulp_href ?? ""),
        )
      ).data,
    onSuccess: (data, distribution) => {
      void queryClient.invalidateQueries({ queryKey: distributionKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: distributionKeys.detail(distribution.pulp_href ?? ""),
      });
      // Surface the new delete task on the row without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, distribution);
    },
    onError: options?.onError,
  });
};

/**
 * Caller-tunable slice of the query config: everything `useQuery`/`queryOptions`
 * accept except the two fields this module owns (`queryKey`, `queryFn`).
 */
type DistributionDetailOptions = Omit<
  UseQueryOptions<DistributionResponse, DrfAxiosError>,
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
  queryOptions<DistributionResponse, DrfAxiosError>({
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
export const useDistributionCreateMutation = (
  options?: IMutationCallbacks<
    AsyncOperationResponse,
    { apiPath: string; body: Record<string, unknown> }
  >,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    { apiPath: string; body: Record<string, unknown> }
  >({
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
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: distributionKeys.list() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

/** PATCHes a distribution by its own `pulp_href` (which embeds plugin + type). */
export const useDistributionUpdateMutation = (
  options?: IMutationCallbacks<
    DistributionResponse | AsyncOperationResponse,
    { href: string; body: Record<string, unknown> }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    DistributionResponse | AsyncOperationResponse,
    DrfAxiosError,
    { href: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      body: Record<string, unknown>;
    }): Promise<DistributionResponse | AsyncOperationResponse> =>
      (
        await axiosInstance.patch<
          DistributionResponse | AsyncOperationResponse
        >(toProxyHref(href), body)
      ).data,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: distributionKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: distributionKeys.detail(variables.href),
      });
      // Surface the new update task on the row without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};
