import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedPublicationResponseList,
  PublicationResponse,
  PublicationsListData,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { fetchAllPages } from "./utils/fetchAllPages";
import type { AllListParams, ListParams } from "./utils/listParams";
import { pulpApiPath } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const PublicationsQueryKey = "publications";

export type IPublicationListParams = ListParams<PublicationsListData>;

export type IAllPublicationListParams = AllListParams<PublicationsListData>;

export const publicationsRootQueryOptions = queryOptions({
  queryKey: [PublicationsQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const publicationsListQueryOptions = (
  domain: IPulpDomain,
  params: IPublicationListParams,
) =>
  queryOptions({
    queryKey: [
      ...publicationsRootQueryOptions.queryKey,
      "list",
      domain,
      params,
    ],
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
    queryKey: [
      ...publicationsRootQueryOptions.queryKey,
      "list",
      "all",
      domain,
      params,
    ],
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
  const domain = useApiDomain();
  return useQuery(publicationsListQueryOptions(domain, params));
};

export const useAllPublicationsListQuery = (
  params: IAllPublicationListParams = {},
) => {
  const domain = useApiDomain();
  return useQuery(allPublicationsListQueryOptions(domain, params));
};
