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
import type {
  ContentTypeKey,
  ContentTypePage,
  ContentTypeRow,
  IContentTypeAllListParams,
  IContentTypeListParams,
} from "./contentTypes";
import { fetchAllPages } from "./utils/fetchAllPages";
import type { ListParams } from "./utils/listParams";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath, pulpHref, toProxyHref } from "./utils/pulpApi";
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
  typeListQuery: (domain: IPulpDomain, pulpType: string, params: object) =>
    [...contentKeys.list(), domain, pulpType, params] as const,
  typeAllListQuery: (domain: IPulpDomain, pulpType: string, params: object) =>
    [...contentKeys.list(), "all", domain, pulpType, params] as const,
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

/** A content type's own list endpoint (`content/<apiPath>/`), from the catalog. */
const contentTypeUrl = (pulpType: ContentTypeKey, domain: IPulpDomain) =>
  pulpApiPath(`content/${getContentType(pulpType)?.apiPath}/`, domain);

type ContentTypeListOptions<K extends ContentTypeKey> = Omit<
  UseQueryOptions<ContentTypePage<K>, DrfAxiosError>,
  "queryKey" | "queryFn"
>;

/**
 * One content type's own list (`content/<apiPath>/`, path from the catalog): full typed
 * rows, the type's filters and multi-field ordering. The caller decides every param,
 * so one query serves every list, lookup (`pulp_href__in`) and field selection.
 */
export const contentTypeListQueryOptions = <K extends ContentTypeKey>({
  domain,
  pulpType,
  params,
  options,
}: {
  domain: IPulpDomain;
  pulpType: K;
  params: IContentTypeListParams<K>;
  options?: ContentTypeListOptions<K>;
}) =>
  queryOptions<ContentTypePage<K>, DrfAxiosError>({
    ...options,
    queryKey: contentKeys.typeListQuery(domain, pulpType, params),
    queryFn: async (): Promise<ContentTypePage<K>> => {
      const response = await axiosInstance.get<ContentTypePage<K>>(
        contentTypeUrl(pulpType, domain),
        { params },
      );
      return response.data;
    },
  });

/** Disabled for a type without an endpoint, or when the caller passes `enabled: false`. */
export const useContentTypeListQuery = <K extends ContentTypeKey>({
  pulpType,
  params,
  options,
}: {
  pulpType: K;
  params: IContentTypeListParams<K>;
  options?: ContentTypeListOptions<K>;
}) => {
  const domain = useSelectedDomain();
  return useQuery({
    ...contentTypeListQueryOptions({ domain, pulpType, params, options }),
    enabled: !!getContentType(pulpType)?.apiPath && options?.enabled !== false,
  });
};

/**
 * Every page of one content type's list, for small sets matched in the browser
 * (e.g. a version's signatures) when the endpoint has no `__in` filter for the link.
 */
export const allContentTypeListQueryOptions = <K extends ContentTypeKey>({
  domain,
  pulpType,
  params,
  options,
}: {
  domain: IPulpDomain;
  pulpType: K;
  params: IContentTypeAllListParams<K>;
  options?: ContentTypeListOptions<K>;
}) =>
  queryOptions<ContentTypePage<K>, DrfAxiosError>({
    ...options,
    queryKey: contentKeys.typeAllListQuery(domain, pulpType, params),
    queryFn: async (): Promise<ContentTypePage<K>> => {
      const { results, count } = await fetchAllPages<ContentTypeRow<K>>(
        async (offset, limit) => {
          const response = await axiosInstance.get<ContentTypePage<K>>(
            contentTypeUrl(pulpType, domain),
            { params: { ...params, offset, limit } },
          );
          return response.data;
        },
      );
      return {
        count,
        next: null,
        previous: null,
        results,
      } as ContentTypePage<K>;
    },
  });

export const useContentTypeAllQuery = <K extends ContentTypeKey>({
  pulpType,
  params,
  options,
}: {
  pulpType: K;
  params: IContentTypeAllListParams<K>;
  options?: ContentTypeListOptions<K>;
}) => {
  const domain = useSelectedDomain();
  return useQuery({
    ...allContentTypeListQueryOptions({ domain, pulpType, params, options }),
    enabled: !!getContentType(pulpType)?.apiPath && options?.enabled !== false,
  });
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
  return apiPath ? pulpHref(`content/${apiPath}/${id}/`, domain) : null;
};
