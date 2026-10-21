import { queryOptions, useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

import { getContentType } from "@catalog";
import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  ContentListData,
  MultipleArtifactContentResponse,
  PaginatedMultipleArtifactContentResponseList,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { ListParams } from "./utils/listParams";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
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

/**
 * Typed per-unit GET (the aggregate list is sparse). Generic over the response type:
 * the payload varies by pulp_type, so each caller passes the concrete generated type
 * (e.g. `useContentDetailQuery<FileFileContentResponse>`) — never a union.
 */
export const contentDetailQueryOptions = <T = MultipleArtifactContentResponse>({
  href,
  options,
}: {
  href: string | null;
  options?: Omit<UseQueryOptions<T, DrfAxiosError>, "queryKey" | "queryFn">;
}) =>
  queryOptions<T, DrfAxiosError>({
    ...options,
    queryKey: contentKeys.detail(href ?? ""),
    queryFn: async (): Promise<T> =>
      (await axiosInstance.get<T>(toProxyHref(href ?? ""))).data,
  });

export const useContentDetailQuery = <T = MultipleArtifactContentResponse>({
  href,
}: {
  href: string | null;
}) => useQuery({ ...contentDetailQueryOptions<T>({ href }), enabled: !!href });

/**
 * Reconstruct a content unit's `pulp_href` from its route parts — the content detail
 * route encodes `pulp_type` + pk rather than the opaque href. Mirrors
 * `buildRepositoryHref`; `null` for endpoint-less types (no `apiPath`).
 */
export const buildContentHref = (
  pulpType: string,
  id: string,
  domain: IPulpDomain,
): string | null => {
  const apiPath = getContentType(pulpType)?.apiPath;
  return apiPath ? pulpApiPath(`content/${apiPath}/${id}/`, domain) : null;
};
