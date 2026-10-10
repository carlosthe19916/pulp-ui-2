import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  ContentListData,
  PaginatedMultipleArtifactContentResponseList,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const ContentQueryKey = "content";

export type IContentListParams = ListParams<ContentListData>;

export const contentRootQueryOptions = queryOptions({
  queryKey: [ContentQueryKey],
  queryFn: async (): Promise<null> => null,
});

/**
 * Query-key factory mirroring the REST paths. Identifying segments precede
 * params so a prefix invalidates all variants of a collection. Shared by the
 * query options and the generic CRUD mutations (via `contentRootQueryOptions`)
 * to prevent key drift.
 */
export const contentKeys = {
  // --- invalidation folders (prefixes for invalidateQueries) ---
  // ["content"]
  all: () => [ContentQueryKey] as const,
  // ["content", "list"] — every list query, any domain/params
  list: () => [...contentKeys.all(), "list"] as const,
  // ["content", "detail", contentHref]
  detail: (contentHref: string) =>
    [...contentKeys.all(), "detail", contentHref] as const,

  // --- real query keys (for useQuery / queryOptions) ---
  // ["content", "list", domain, params]
  listQuery: (domain: IPulpDomain, params: IContentListParams) =>
    [...contentKeys.list(), domain, params] as const,
  // ["content", "detail", contentHref] — same value as detail() (no params)
  detailQuery: (contentHref: string) => contentKeys.detail(contentHref),
};

export const contentListQueryOptions = (
  domain: IPulpDomain,
  params: IContentListParams,
  options?: { enabled?: boolean },
) =>
  queryOptions({
    queryKey: contentKeys.listQuery(domain, params),
    queryFn:
      async (): Promise<PaginatedMultipleArtifactContentResponseList> => {
        const response =
          await axiosInstance.get<PaginatedMultipleArtifactContentResponseList>(
            pulpApiPath("content/", domain),
            {
              params: {
                ...params,
                ordering: params.ordering ? [params.ordering] : undefined,
              },
            },
          );
        return response.data;
      },
    enabled: options?.enabled ?? true,
  });

export const useContentListQuery = (
  params: IContentListParams,
  options?: { enabled?: boolean },
) => {
  const domain = useSelectedDomain();
  return useQuery(contentListQueryOptions(domain, params, options));
};
