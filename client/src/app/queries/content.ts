import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  ContentListData,
  PaginatedMultipleArtifactContentResponseList,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const ContentQueryKey = "content";

export type IContentListParams = ListParams<ContentListData>;

export const contentRootQueryOptions = queryOptions({
  queryKey: [ContentQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const contentListQueryOptions = (
  domain: IPulpDomain,
  params: IContentListParams,
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
  const domain = useApiDomain();
  return useQuery(contentListQueryOptions(domain, params, options));
};
