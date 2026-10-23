import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedUpstreamPulpResponseList,
  TaskGroupOperationResponse,
  UpstreamPulpResponse,
  UpstreamPulpsListData,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { taskKeys } from "./tasks";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const UpstreamPulpsQueryKey = "upstream-pulps";

export type IUpstreamPulpListParams = ListParams<UpstreamPulpsListData>;

export const upstreamPulpKeys = {
  all: () => [UpstreamPulpsQueryKey] as const,
  list: () => [...upstreamPulpKeys.all(), "list"] as const,
  listQuery: (domain: IPulpDomain, params: IUpstreamPulpListParams) =>
    [...upstreamPulpKeys.list(), domain, params] as const,
};

export const upstreamPulpsListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IUpstreamPulpListParams;
}) =>
  queryOptions<PaginatedUpstreamPulpResponseList, DrfAxiosError>({
    queryKey: upstreamPulpKeys.listQuery(domain, params),
    queryFn: async () =>
      (
        await axiosInstance.get<PaginatedUpstreamPulpResponseList>(
          pulpApiPath("upstream-pulps/", domain),
          {
            params: {
              ...params,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        )
      ).data,
  });

export const useUpstreamPulpsListQuery = ({
  params,
}: {
  params: IUpstreamPulpListParams;
}) => {
  const domain = useSelectedDomain();
  return useQuery(upstreamPulpsListQueryOptions({ domain, params }));
};

export const useUpstreamPulpCreateMutation = (
  options?: IMutationCallbacks<UpstreamPulpResponse, Record<string, unknown>>,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    UpstreamPulpResponse,
    DrfAxiosError,
    Record<string, unknown>
  >({
    mutationFn: async (body) =>
      (
        await axiosInstance.post<UpstreamPulpResponse>(
          pulpApiPath("upstream-pulps/", domain),
          body,
        )
      ).data,
    onSuccess: (data, body) => {
      void queryClient.invalidateQueries({ queryKey: upstreamPulpKeys.list() });
      options?.onSuccess?.(data, body);
    },
    onError: options?.onError,
  });
};

export const useUpstreamPulpUpdateMutation = (
  options?: IMutationCallbacks<
    UpstreamPulpResponse,
    { href: string; body: Record<string, unknown> }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    UpstreamPulpResponse,
    DrfAxiosError,
    { href: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({ href, body }) =>
      (await axiosInstance.patch<UpstreamPulpResponse>(toProxyHref(href), body))
        .data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: upstreamPulpKeys.list() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

export const useUpstreamPulpDeleteMutation = (
  options?: IMutationCallbacks<void, UpstreamPulpResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, UpstreamPulpResponse>({
    mutationFn: async (upstream) => {
      await axiosInstance.delete(toProxyHref(upstream.pulp_href ?? ""));
    },
    onSuccess: (data, upstream) => {
      void queryClient.invalidateQueries({ queryKey: upstreamPulpKeys.list() });
      options?.onSuccess?.(data, upstream);
    },
    onError: options?.onError,
  });
};

/** Mirrors the upstream's distributions into this domain; starts a task group. */
export const useUpstreamPulpReplicateMutation = (
  options?: IMutationCallbacks<
    TaskGroupOperationResponse,
    { href: string; body: Record<string, unknown> }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    TaskGroupOperationResponse,
    DrfAxiosError,
    { href: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({ href, body }) =>
      (
        await axiosInstance.post<TaskGroupOperationResponse>(
          `${toProxyHref(href)}replicate/`,
          body,
        )
      ).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: upstreamPulpKeys.list() });
      void queryClient.invalidateQueries({ queryKey: taskKeys.list() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};
