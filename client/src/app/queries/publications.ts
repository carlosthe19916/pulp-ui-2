import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

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
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const PublicationsQueryKey = "publications";

export type IPublicationListParams = ListParams<PublicationsListData>;

export type IAllPublicationListParams = AllListParams<PublicationsListData>;

export const publicationsRootQueryOptions = queryOptions({
  queryKey: [PublicationsQueryKey],
  queryFn: async (): Promise<null> => null,
});

/**
 * Query-key factory mirroring the REST paths. The `"all"` fetch variant nests
 * under `list` (identifying segments precede params) so a `list` prefix
 * invalidates both the paginated and fetch-all list queries. Shared by the
 * query options and the generic CRUD mutations (via
 * `publicationsRootQueryOptions`) to prevent key drift.
 */
export const publicationKeys = {
  // --- invalidation folders (prefixes for invalidateQueries) ---
  // ["publications"]
  all: () => [PublicationsQueryKey] as const,
  // ["publications", "list"] — every list query (paginated + fetch-all)
  list: () => [...publicationKeys.all(), "list"] as const,
  // ["publications", "detail", pubHref]
  detail: (pubHref: string) =>
    [...publicationKeys.all(), "detail", pubHref] as const,

  // --- real query keys (for useQuery / queryOptions) ---
  // ["publications", "list", domain, params]
  listQuery: (domain: IPulpDomain, params: IPublicationListParams) =>
    [...publicationKeys.list(), domain, params] as const,
  // ["publications", "list", "all", domain, params] — fetch-all variant
  allListQuery: (domain: IPulpDomain, params: IAllPublicationListParams) =>
    [...publicationKeys.list(), "all", domain, params] as const,
  // ["publications", "detail", pubHref] — same value as detail() (no params)
  detailQuery: (pubHref: string) => publicationKeys.detail(pubHref),
};

export const publicationsListQueryOptions = (
  domain: IPulpDomain,
  params: IPublicationListParams,
) =>
  queryOptions({
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
export const allPublicationsListQueryOptions = (
  domain: IPulpDomain,
  params: IAllPublicationListParams = {},
) =>
  queryOptions({
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

export const usePublicationsListQuery = (params: IPublicationListParams) => {
  const domain = useSelectedDomain();
  return useQuery(publicationsListQueryOptions(domain, params));
};

/** Deletes a publication — synchronous (204, no task), unlike the other families. */
export const usePublicationDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (href: string): Promise<void> => {
      await axiosInstance.delete(toProxyHref(href));
    },
    onSuccess: (_data, href) => {
      void queryClient.invalidateQueries({ queryKey: publicationKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: publicationKeys.detail(href),
      });
    },
  });
};

export const useAllPublicationsListQuery = (
  params: IAllPublicationListParams = {},
) => {
  const domain = useSelectedDomain();
  return useQuery(allPublicationsListQueryOptions(domain, params));
};

/**
 * Creates a publication of the given plugin type: POSTs to `publications/<apiPath>/`
 * (apiPath from the catalog). Publication creation is asynchronous, so it returns the
 * Pulp 202 task. Publications are immutable — there is no update.
 */
export const usePublicationCreateMutation = () => {
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
          pulpApiPath(`publications/${apiPath}/`, domain),
          body,
        )
      ).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: publicationKeys.list() });
    },
  });
};
