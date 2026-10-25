import type { ContentUploadMechanism } from "@catalog";
import type { UseQueryOptions } from "@tanstack/react-query";
import {
  queryOptions,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  ContentListData,
  MultipleArtifactContentResponse,
  PaginatedMultipleArtifactContentResponseList,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { getContentType } from "@catalog";

import type {
  ContentTypeKey,
  ContentTypePage,
  IContentTypeListParams,
} from "./contentTypes";
import { waitForTask } from "./tasks";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath, pulpHref, toProxyHref } from "./utils/pulpApi";

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
  /** A `fields` subset gets its own slot under the full detail, so invalidation covers both. */
  detailQuery: (contentHref: string, fields?: string[]) =>
    fields
      ? ([...contentKeys.detail(contentHref), { fields }] as const)
      : contentKeys.detail(contentHref),
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
 * One content type's own list (`content/<apiPath>/`): typed rows, its filters and
 * multi-field ordering. The caller decides every param.
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
 * One list query per entry of `paramsList` (a `use*Queries` fan-out), e.g. a per-row
 * `limit: 1` count probe on a link filter the endpoint can't OR across rows.
 */
export const useContentTypeListQueries = <K extends ContentTypeKey>({
  pulpType,
  paramsList,
}: {
  pulpType: K;
  paramsList: IContentTypeListParams<K>[];
}) => {
  const domain = useSelectedDomain();
  return useQueries({
    queries: paramsList.map((params) => ({
      ...contentTypeListQueryOptions({ domain, pulpType, params }),
      enabled: !!getContentType(pulpType)?.apiPath,
    })),
  });
};

/**
 * Typed per-unit GET (the aggregate list is sparse). Callers pass the concrete generated
 * type for the pulp_type, never a union; `fields` narrows the response or requests
 * fields the API omits by default.
 */
export const contentDetailQueryOptions = <T = MultipleArtifactContentResponse>({
  href,
  fields,
  options,
}: {
  href: string | null;
  fields?: string[];
  options?: Omit<UseQueryOptions<T, DrfAxiosError>, "queryKey" | "queryFn">;
}) =>
  queryOptions<T, DrfAxiosError>({
    ...options,
    queryKey: contentKeys.detailQuery(href ?? "", fields),
    queryFn: async (): Promise<T> =>
      (
        await axiosInstance.get<T>(toProxyHref(href ?? ""), {
          params: fields ? { fields } : undefined,
        })
      ).data,
  });

export const useContentDetailQuery = <T = MultipleArtifactContentResponse>({
  href,
  fields,
}: {
  href: string | null;
  fields?: string[];
}) =>
  useQuery({
    ...contentDetailQueryOptions<T>({ href, fields }),
    enabled: !!href,
  });

export const useSuspenseContentDetailQuery = <
  T = MultipleArtifactContentResponse,
>({
  href,
}: {
  href: string;
}) => useSuspenseQuery(contentDetailQueryOptions<T>({ href }));

/**
 * Rebuild a content unit's `pulp_href` from its route's `pulp_type` + pk; `null` for
 * endpoint-less types.
 */
export const buildContentHref = (
  pulpType: string,
  id: string,
  domain: IPulpDomain,
): string | null => {
  const apiPath = getContentType(pulpType)?.apiPath;
  return apiPath ? pulpHref(`content/${apiPath}/${id}/`, domain) : null;
};

/**
 * One content upload: the type's `apiPath` and catalog upload `mechanism`, its
 * upload fields, and the bytes — the `file` itself, or the href of a chunked `upload`.
 */
export interface IContentUploadVariables {
  apiPath: string;
  mechanism: ContentUploadMechanism;
  fields: Record<string, string>;
  file?: File;
  upload?: string;
  onProgress?: (fraction: number) => void;
}

/**
 * Creates a content unit from a file and returns its href. Not tied to a repository:
 * callers add the hrefs in one `modify/` so a batch makes one version.
 */
export const useContentUploadMutation = (
  options?: IMutationCallbacks<string, IContentUploadVariables>,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<string, DrfAxiosError, IContentUploadVariables>({
    mutationFn: async ({
      apiPath,
      mechanism,
      fields,
      file,
      upload,
      onProgress,
    }: IContentUploadVariables) => {
      const body = new FormData();
      for (const [key, value] of Object.entries(fields)) {
        if (value.trim()) body.append(key, value.trim());
      }
      if (file) body.append("file", file);
      if (upload) body.append("upload", upload);
      const path =
        mechanism === "upload" ? `${apiPath}/upload/` : `${apiPath}/`;
      const { data } = await axiosInstance.post<
        MultipleArtifactContentResponse | AsyncOperationResponse
      >(pulpApiPath(`content/${path}`, domain), body, {
        adapter: "xhr",
        onUploadProgress: (event) =>
          onProgress?.(event.total ? event.loaded / event.total : 0),
      });
      if ("task" in data) {
        const task = await waitForTask(data.task);
        return task.created_resources?.[0] ?? "";
      }
      return data.pulp_href ?? "";
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: contentKeys.list() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};
