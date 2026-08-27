import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedPublicationResponseList,
  PublicationsListData,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { pulpApiPath } from "./utils/pulpApi";
import type { PulpDomain } from "./utils/pulpApi";

export const PublicationsQueryKey = "publications";

type PublicationQuery = NonNullable<PublicationsListData["query"]>;

interface PublicationListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<PublicationQuery["ordering"]>[number];
  pulp_type?: PublicationQuery["pulp_type"];
}

export const publicationsRootQueryOptions = queryOptions({
  queryKey: [PublicationsQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const publicationsListQueryOptions = (
  domain: PulpDomain,
  params: PublicationListParams = {},
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
              limit: params.limit ?? 20,
              offset: params.offset,
              ordering: params.ordering ? [params.ordering] : undefined,
              pulp_type: params.pulp_type,
            },
          },
        );
      if (!response.data) {
        throw new Error("Empty publications list response");
      }
      return response.data;
    },
  });

export const usePublicationsListQuery = (
  params: PublicationListParams = {},
) => {
  const domain = useApiDomain();
  return useQuery(publicationsListQueryOptions(domain, params));
};
