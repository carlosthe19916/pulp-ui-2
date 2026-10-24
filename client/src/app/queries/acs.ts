import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AcsFileFileListData,
  AsyncOperationResponse,
  FileFileAlternateContentSourceResponse,
  PaginatedfileFileAlternateContentSourceResponseList,
  TaskGroupOperationResponse,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

import { taskKeys } from "./tasks";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";

export const AcsQueryKey = "acs";

/** Every plugin's alternate content source has this shape. */
export type AlternateContentSource = FileFileAlternateContentSourceResponse;

export type IAcsListParams = ListParams<AcsFileFileListData>;

/** Keyed by the plugin's `acs/<apiPath>/` collection (there is no aggregate list). */
export const acsKeys = {
  all: () => [AcsQueryKey] as const,
  list: () => [...acsKeys.all(), "list"] as const,
  listQuery: (domain: IPulpDomain, apiPath: string, params: IAcsListParams) =>
    [...acsKeys.list(), domain, apiPath, params] as const,
};

export const acsListQueryOptions = ({
  domain,
  apiPath,
  params,
}: {
  domain: IPulpDomain;
  apiPath: string;
  params: IAcsListParams;
}) =>
  queryOptions<
    PaginatedfileFileAlternateContentSourceResponseList,
    DrfAxiosError
  >({
    queryKey: acsKeys.listQuery(domain, apiPath, params),
    queryFn: async () =>
      (
        await axiosInstance.get<PaginatedfileFileAlternateContentSourceResponseList>(
          pulpApiPath(`acs/${apiPath}/`, domain),
          {
            params: {
              ...params,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        )
      ).data,
  });

export const useAcsListQuery = ({
  apiPath,
  params,
}: {
  apiPath: string;
  params: IAcsListParams;
}) => {
  const domain = useSelectedDomain();
  return useQuery({
    ...acsListQueryOptions({ domain, apiPath, params }),
    enabled: !!apiPath,
  });
};

export const useAcsCreateMutation = (
  options?: IMutationCallbacks<
    AlternateContentSource,
    { apiPath: string; body: Record<string, unknown> }
  >,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    AlternateContentSource,
    DrfAxiosError,
    { apiPath: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({ apiPath, body }) =>
      (
        await axiosInstance.post<AlternateContentSource>(
          pulpApiPath(`acs/${apiPath}/`, domain),
          body,
        )
      ).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: acsKeys.list() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

/** Updates an ACS; Pulp answers with the source or, when it must, a task. */
export const useAcsUpdateMutation = (
  options?: IMutationCallbacks<
    AlternateContentSource | AsyncOperationResponse,
    { href: string; body: Record<string, unknown> }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    AlternateContentSource | AsyncOperationResponse,
    DrfAxiosError,
    { href: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({ href, body }) =>
      (
        await axiosInstance.patch<
          AlternateContentSource | AsyncOperationResponse
        >(toProxyHref(href), body)
      ).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: acsKeys.list() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

export const useAcsDeleteMutation = (
  options?: IMutationCallbacks<AsyncOperationResponse, AlternateContentSource>,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    AlternateContentSource
  >({
    mutationFn: async (acs) =>
      (
        await axiosInstance.delete<AsyncOperationResponse>(
          toProxyHref(acs.pulp_href ?? ""),
        )
      ).data,
    onSuccess: (data, acs) => {
      void queryClient.invalidateQueries({ queryKey: acsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: taskKeys.list() });
      options?.onSuccess?.(data, acs);
    },
    onError: options?.onError,
  });
};

/** Re-reads the source's metadata so syncs can use it; starts a task group. */
export const useAcsRefreshMutation = (
  options?: IMutationCallbacks<
    TaskGroupOperationResponse,
    AlternateContentSource
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    TaskGroupOperationResponse,
    DrfAxiosError,
    AlternateContentSource
  >({
    mutationFn: async (acs) =>
      (
        await axiosInstance.post<TaskGroupOperationResponse>(
          `${toProxyHref(acs.pulp_href ?? "")}refresh/`,
        )
      ).data,
    onSuccess: (data, acs) => {
      void queryClient.invalidateQueries({ queryKey: acsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: taskKeys.list() });
      options?.onSuccess?.(data, acs);
    },
    onError: options?.onError,
  });
};
