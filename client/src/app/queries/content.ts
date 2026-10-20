import { queryOptions, useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  ContentListData,
  PaginatedMultipleArtifactContentResponseList,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { ListParams } from "./utils/listParams";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const ContentQueryKey = "content";

export type IContentListParams = ListParams<ContentListData>;

/**
 * Query-key factory mirroring the REST paths; identifying segments precede params
 * so a prefix invalidates all variants.
 */
export const contentKeys = {
  all: () => [ContentQueryKey] as const,
  list: () => [...contentKeys.all(), "list"] as const,
  detail: (contentHref: string) =>
    [...contentKeys.all(), "detail", contentHref] as const,

  listQuery: (domain: IPulpDomain, params: IContentListParams) =>
    [...contentKeys.list(), domain, params] as const,
  detailQuery: (contentHref: string) => contentKeys.detail(contentHref),
};

export const contentListQueryOptions = ({
  domain,
  params,
  options,
}: {
  domain: IPulpDomain;
  params: IContentListParams;
  options?: Omit<
    UseQueryOptions<
      PaginatedMultipleArtifactContentResponseList,
      DrfAxiosError
    >,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<PaginatedMultipleArtifactContentResponseList, DrfAxiosError>({
    ...options,
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
  });

export const useContentListQuery = ({
  params,
  options,
}: {
  params: IContentListParams;
  options?: Omit<
    UseQueryOptions<
      PaginatedMultipleArtifactContentResponseList,
      DrfAxiosError
    >,
    "queryKey" | "queryFn"
  >;
}) => {
  const domain = useSelectedDomain();
  return useQuery(contentListQueryOptions({ domain, params, options }));
};
