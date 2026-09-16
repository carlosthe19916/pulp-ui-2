import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedPublicationResponseList,
  PublicationsListData,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const PublicationsQueryKey = "publications";

export type IPublicationListParams = ListParams<PublicationsListData>;

export const publicationsRootQueryOptions = queryOptions({
  queryKey: [PublicationsQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const publicationsListQueryOptions = (
  domain: IPulpDomain,
  params: IPublicationListParams = {},
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
              limit: params.limit ?? 20,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        );
      return response.data;
    },
  });

export const usePublicationsListQuery = (
  params: IPublicationListParams = {},
) => {
  const domain = useApiDomain();
  return useQuery(publicationsListQueryOptions(domain, params));
};
