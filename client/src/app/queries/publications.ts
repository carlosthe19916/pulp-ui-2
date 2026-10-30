import type { UseQueryOptions } from "@tanstack/react-query";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  PaginatedPublicationResponseList,
  PublicationResponse,
  PublicationsListData,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";

export const PublicationsQueryKey = "publications";

export type IPublicationListParams = ListParams<PublicationsListData>;

/**
 * Query-key factory mirroring the REST paths; identifying segments precede params so a
 * prefix invalidates all variants.
 */
export const publicationKeys = {
  all: () => [PublicationsQueryKey] as const,
  list: () => [...publicationKeys.all(), "list"] as const,
  detail: (pubHref: string) =>
    [...publicationKeys.all(), "detail", pubHref] as const,

  listQuery: (
    domain: IPulpDomain,
    params: IPublicationListParams,
    apiPath?: string,
  ) => [...publicationKeys.list(), domain, apiPath, params] as const,
  detailQuery: (pubHref: string) => publicationKeys.detail(pubHref),
};

type PublicationListOptions = Omit<
  UseQueryOptions<PaginatedPublicationResponseList, DrfAxiosError>,
  "queryKey" | "queryFn"
>;

/**
 * Lists publications: the cross-type aggregate, or one plugin's typed collection when
 * `apiPath` is given (only typed ones carry `distributions`).
 */
export const publicationsListQueryOptions = ({
  domain,
  apiPath,
  params,
  options,
}: {
  domain: IPulpDomain;
  apiPath?: string;
  params: IPublicationListParams;
  options?: PublicationListOptions;
}) =>
  queryOptions<PaginatedPublicationResponseList, DrfAxiosError>({
    ...options,
    queryKey: publicationKeys.listQuery(domain, params, apiPath),
    queryFn: async (): Promise<PaginatedPublicationResponseList> => {
      const response =
        await axiosInstance.get<PaginatedPublicationResponseList>(
          pulpApiPath(
            apiPath ? `publications/${apiPath}/` : "publications/",
            domain,
          ),
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

export const usePublicationsListQuery = ({
  apiPath,
  params,
  options,
}: {
  apiPath?: string;
  params: IPublicationListParams;
  options?: PublicationListOptions;
}) => {
  const domain = useSelectedDomain();
  return useQuery(
    publicationsListQueryOptions({ domain, apiPath, params, options }),
  );
};

/** Deletes a publication — synchronous (204, no task), unlike the other families. */
export const usePublicationDeleteMutation = (
  options?: IMutationCallbacks<void, PublicationResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, PublicationResponse>({
    mutationFn: async (publication: PublicationResponse): Promise<void> => {
      await axiosInstance.delete(toProxyHref(publication.pulp_href ?? ""));
    },
    onSuccess: (data, publication) => {
      void queryClient.invalidateQueries({ queryKey: publicationKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: publicationKeys.detail(publication.pulp_href ?? ""),
      });
      options?.onSuccess?.(data, publication);
    },
    onError: options?.onError,
  });
};

/**
 * Creates a publication of the given plugin type (`publications/<apiPath>/`); returns the
 * 202 task. Publications are immutable: no update.
 */
export const usePublicationCreateMutation = (
  options?: IMutationCallbacks<
    AsyncOperationResponse,
    { apiPath: string; body: Record<string, unknown> }
  >,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    { apiPath: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({
      apiPath,
      body,
    }: {
      apiPath: string;
      body: Record<string, unknown>;
    }): Promise<AsyncOperationResponse> =>
      (
        await axiosInstance.post<AsyncOperationResponse>(
          pulpApiPath(`publications/${apiPath}/`, domain),
          body,
        )
      ).data,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: publicationKeys.list() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};
