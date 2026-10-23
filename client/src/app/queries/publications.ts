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
  PaginatedPublicationResponseList,
  PublicationResponse,
  PublicationsListData,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { fetchAllPages } from "./utils/fetchAllPages";
import type { AllListParams, ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const PublicationsQueryKey = "publications";

export type IPublicationListParams = ListParams<PublicationsListData>;

export type IAllPublicationListParams = AllListParams<PublicationsListData>;

/**
 * Query-key factory mirroring the REST paths; identifying segments precede
 * params so a `list` prefix invalidates all variants (paginated + fetch-all).
 * Shared by the query options and the generic CRUD mutations to prevent key drift.
 */
export const publicationKeys = {
  all: () => [PublicationsQueryKey] as const,
  list: () => [...publicationKeys.all(), "list"] as const,
  detail: (pubHref: string) =>
    [...publicationKeys.all(), "detail", pubHref] as const,

  listQuery: (domain: IPulpDomain, params: IPublicationListParams) =>
    [...publicationKeys.list(), domain, params] as const,
  allListQuery: (domain: IPulpDomain, params: IAllPublicationListParams) =>
    [...publicationKeys.list(), "all", domain, params] as const,
  detailQuery: (pubHref: string) => publicationKeys.detail(pubHref),
};

type PublicationListOptions = Omit<
  UseQueryOptions<PaginatedPublicationResponseList, DrfAxiosError>,
  "queryKey" | "queryFn"
>;

export const publicationsListQueryOptions = ({
  domain,
  params,
  options,
}: {
  domain: IPulpDomain;
  params: IPublicationListParams;
  options?: PublicationListOptions;
}) =>
  queryOptions<PaginatedPublicationResponseList, DrfAxiosError>({
    ...options,
    queryKey: publicationKeys.listQuery(domain, params),
    queryFn: async (): Promise<PaginatedPublicationResponseList> => {
      const response =
        await axiosInstance.get<PaginatedPublicationResponseList>(
          pulpApiPath("publications/", domain),
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

/** Publications have no server-side name filter, so fetch all for the static picker select. */
export const allPublicationsListQueryOptions = ({
  domain,
  params = {},
}: {
  domain: IPulpDomain;
  params?: IAllPublicationListParams;
}) =>
  queryOptions<PaginatedPublicationResponseList, DrfAxiosError>({
    queryKey: publicationKeys.allListQuery(domain, params),
    queryFn: async (): Promise<PaginatedPublicationResponseList> => {
      const { results, count } = await fetchAllPages<PublicationResponse>(
        async (offset, limit) => {
          const response =
            await axiosInstance.get<PaginatedPublicationResponseList>(
              pulpApiPath("publications/", domain),
              {
                params: {
                  ...params,
                  offset,
                  limit,
                  ordering: params.ordering ? [params.ordering] : undefined,
                },
              },
            );
          return response.data;
        },
      );
      return { count, next: null, previous: null, results };
    },
  });

export const usePublicationsListQuery = ({
  params,
  options,
}: {
  params: IPublicationListParams;
  options?: PublicationListOptions;
}) => {
  const domain = useSelectedDomain();
  return useQuery(publicationsListQueryOptions({ domain, params, options }));
};

/** Deletes a publication — synchronous (204, no task), unlike the other families. */
export const usePublicationDeleteMutation = (
  options?: IMutationCallbacks<void, PublicationResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, PublicationResponse>({
    mutationFn: async (publication: PublicationResponse): Promise<void> => {
      await axiosInstance.delete(toProxyHref(publication.pulp_href ?? ""));
    },
    onSuccess: (data, publication) => {
      void queryClient.invalidateQueries({ queryKey: publicationKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: publicationKeys.detail(publication.pulp_href ?? ""),
      });
      options?.onSuccess?.(data, publication);
    },
    onError: options?.onError,
  });
};

export const useAllPublicationsListQuery = ({
  params = {},
}: {
  params?: IAllPublicationListParams;
} = {}) => {
  const domain = useSelectedDomain();
  return useQuery(allPublicationsListQueryOptions({ domain, params }));
};

/**
 * Creates a publication of the given plugin type: POSTs to `publications/<apiPath>/`
 * (apiPath from the catalog). Publication creation is asynchronous, so it returns the
 * Pulp 202 task. Publications are immutable — there is no update.
 */
export const usePublicationCreateMutation = (
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
          pulpApiPath(`publications/${apiPath}/`, domain),
          body,
        )
      ).data,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: publicationKeys.list() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};
