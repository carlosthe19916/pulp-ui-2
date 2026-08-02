import { queryOptions, useQuery } from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type { PaginatedPublicationResponseList } from "@app/client";
import { publicationsList } from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

export const PublicationsQueryKey = "publications";

type PublicationOrdering = NonNullable<
  Parameters<typeof publicationsList>[0]["query"]
>["ordering"];

interface PublicationListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<PublicationOrdering>[number];
  pulp_type?: NonNullable<
    Parameters<typeof publicationsList>[0]["query"]
  >["pulp_type"];
}

export const publicationsRootQueryOptions = queryOptions({
  queryKey: [PublicationsQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const publicationsListQueryOptions = (
  params: PublicationListParams = {},
) =>
  queryOptions({
    queryKey: [...publicationsRootQueryOptions.queryKey, "list", params],
    queryFn: async (): Promise<PaginatedPublicationResponseList> => {
      const response = await publicationsList({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        query: {
          limit: params.limit ?? 20,
          offset: params.offset,
          ordering: params.ordering ? [params.ordering] : undefined,
          pulp_type: params.pulp_type,
        },
      });
      if (!response.data) {
        throw new Error("Empty publications list response");
      }
      return response.data;
    },
  });

export const usePublicationsListQuery = (
  params: PublicationListParams = {},
) => {
  return useQuery(publicationsListQueryOptions(params));
};
