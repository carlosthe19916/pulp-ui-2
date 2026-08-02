import { queryOptions, useQuery } from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type { PaginatedMultipleArtifactContentResponseList } from "@app/client";
import { contentList } from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

export const ContentQueryKey = "content";

type ContentOrdering = NonNullable<
  Parameters<typeof contentList>[0]["query"]
>["ordering"];

export interface ContentListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<ContentOrdering>[number];
  pulp_type?: NonNullable<
    Parameters<typeof contentList>[0]["query"]
  >["pulp_type"];
  repository_version?: string;
}

export const contentRootQueryOptions = queryOptions({
  queryKey: [ContentQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const contentListQueryOptions = (
  params: ContentListParams = {},
  options?: { enabled?: boolean },
) =>
  queryOptions({
    queryKey: [...contentRootQueryOptions.queryKey, "list", params],
    queryFn:
      async (): Promise<PaginatedMultipleArtifactContentResponseList> => {
        const response = await contentList({
          client,
          path: { pulp_domain: PULP_DOMAIN },
          query: {
            limit: params.limit ?? 20,
            offset: params.offset,
            ordering: params.ordering ? [params.ordering] : undefined,
            pulp_type: params.pulp_type,
            repository_version: params.repository_version,
          },
        });
        if (!response.data) {
          throw new Error("Empty content list response");
        }
        return response.data;
      },
    enabled: options?.enabled ?? true,
  });

export const useContentListQuery = (
  params: ContentListParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery(contentListQueryOptions(params, options));
};
