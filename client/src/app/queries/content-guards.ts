import type { UseQueryOptions } from "@tanstack/react-query";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  ContentGuardResponse,
  ContentguardsListData,
  PaginatedContentGuardResponseList,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";

export const ContentGuardsQueryKey = "content-guards";

export type IContentGuardListParams = ListParams<ContentguardsListData>;

/** Every guard type shares the base shape; type-specific fields ride along. */
export type ContentGuard = ContentGuardResponse & Record<string, unknown>;

export const contentGuardKeys = {
  all: () => [ContentGuardsQueryKey] as const,
  list: () => [...contentGuardKeys.all(), "list"] as const,
  detail: (href: string) =>
    [...contentGuardKeys.all(), "detail", href] as const,

  listQuery: (domain: IPulpDomain, params: IContentGuardListParams) =>
    [...contentGuardKeys.list(), domain, params] as const,
};

/** The cross-type list over the aggregate `contentguards/` collection. */
export const contentGuardsListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IContentGuardListParams;
}) =>
  queryOptions<PaginatedContentGuardResponseList, DrfAxiosError>({
    queryKey: contentGuardKeys.listQuery(domain, params),
    queryFn: async (): Promise<PaginatedContentGuardResponseList> =>
      (
        await axiosInstance.get<PaginatedContentGuardResponseList>(
          pulpApiPath("contentguards/", domain),
          {
            params: {
              ...params,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        )
      ).data,
  });

export const useContentGuardsListQuery = ({
  params,
}: {
  params: IContentGuardListParams;
}) => {
  const domain = useSelectedDomain();
  return useQuery(contentGuardsListQueryOptions({ domain, params }));
};

export const contentGuardDetailQueryOptions = ({
  href,
  options,
}: {
  href: string;
  options?: Omit<
    UseQueryOptions<ContentGuard, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<ContentGuard, DrfAxiosError>({
    ...options,
    queryKey: contentGuardKeys.detail(href),
    queryFn: async () =>
      (await axiosInstance.get<ContentGuard>(toProxyHref(href))).data,
  });

export const useContentGuardDetailQuery = ({ href }: { href: string }) =>
  useQuery({ ...contentGuardDetailQueryOptions({ href }), enabled: !!href });

/** Creates a guard of one type, by its `contentguards/<apiPath>/` collection. */
export const useContentGuardCreateMutation = (
  options?: IMutationCallbacks<
    ContentGuard,
    { apiPath: string; body: Record<string, unknown> }
  >,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    ContentGuard,
    DrfAxiosError,
    { apiPath: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({ apiPath, body }) =>
      (
        await axiosInstance.post<ContentGuard>(
          pulpApiPath(`contentguards/${apiPath}/`, domain),
          body,
        )
      ).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: contentGuardKeys.list() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

export const useContentGuardUpdateMutation = (
  options?: IMutationCallbacks<
    ContentGuard,
    { href: string; body: Record<string, unknown> }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ContentGuard,
    DrfAxiosError,
    { href: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({ href, body }) =>
      (await axiosInstance.patch<ContentGuard>(toProxyHref(href), body)).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: contentGuardKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: contentGuardKeys.detail(vars.href),
      });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

export const useContentGuardDeleteMutation = (
  options?: IMutationCallbacks<void, ContentGuardResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, ContentGuardResponse>({
    mutationFn: async (guard) => {
      await axiosInstance.delete(toProxyHref(guard.pulp_href ?? ""));
    },
    onSuccess: (data, guard) => {
      void queryClient.invalidateQueries({ queryKey: contentGuardKeys.list() });
      options?.onSuccess?.(data, guard);
    },
    onError: options?.onError,
  });
};
