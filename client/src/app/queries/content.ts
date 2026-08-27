import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  ContentListData,
  PaginatedMultipleArtifactContentResponseList,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { pulpApiPath } from "./utils/pulpApi";
import type { PulpDomain } from "./utils/pulpApi";

export const ContentQueryKey = "content";

type ContentQuery = NonNullable<ContentListData["query"]>;

export interface ContentListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<ContentQuery["ordering"]>[number];
  pulp_type?: ContentQuery["pulp_type"];
  repository_version?: string;
}

export const contentRootQueryOptions = queryOptions({
  queryKey: [ContentQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const contentListQueryOptions = (
  domain: PulpDomain,
  params: ContentListParams = {},
  options?: { enabled?: boolean },
) =>
  queryOptions({
    queryKey: [...contentRootQueryOptions.queryKey, "list", domain, params],
    queryFn:
      async (): Promise<PaginatedMultipleArtifactContentResponseList> => {
        const response =
          await axiosInstance.get<PaginatedMultipleArtifactContentResponseList>(
            pulpApiPath("content/", domain),
            {
              params: {
                limit: params.limit ?? 20,
                offset: params.offset,
                ordering: params.ordering ? [params.ordering] : undefined,
                pulp_type: params.pulp_type,
                repository_version: params.repository_version,
              },
            },
          );
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
  const domain = useApiDomain();
  return useQuery(contentListQueryOptions(domain, params, options));
};
