import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  ArtifactResponse,
  ArtifactsListData,
  PaginatedArtifactResponseList,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export type IArtifactListParams = ListParams<ArtifactsListData>;

export const ArtifactsQueryKey = "artifacts";

/**
 * Query-key factory mirroring the REST paths; identifying segments precede the
 * href so a prefix invalidates all variants.
 */
export const artifactKeys = {
  all: () => [ArtifactsQueryKey] as const,
  list: () => [...artifactKeys.all(), "list"] as const,
  detail: (href: string) => [...artifactKeys.all(), "detail", href] as const,
  listQuery: (domain: IPulpDomain, params: IArtifactListParams) =>
    [...artifactKeys.list(), domain, params] as const,
  detailQuery: (href: string) => artifactKeys.detail(href),
};

export const artifactsListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IArtifactListParams;
}) =>
  queryOptions<PaginatedArtifactResponseList, DrfAxiosError>({
    queryKey: artifactKeys.listQuery(domain, params),
    queryFn: async () =>
      (
        await axiosInstance.get<PaginatedArtifactResponseList>(
          pulpApiPath("artifacts/", domain),
          {
            params: {
              ...params,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        )
      ).data,
  });

export const useArtifactsListQuery = ({
  params,
}: {
  params: IArtifactListParams;
}) => {
  const domain = useSelectedDomain();
  return useQuery(artifactsListQueryOptions({ domain, params }));
};

/** Deletes an artifact (only one no content references). */
export const useArtifactDeleteMutation = (
  options?: IMutationCallbacks<void, ArtifactResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, ArtifactResponse>({
    mutationFn: async (artifact) => {
      await axiosInstance.delete(toProxyHref(artifact.pulp_href ?? ""));
    },
    onSuccess: (data, artifact) => {
      void queryClient.invalidateQueries({ queryKey: artifactKeys.list() });
      options?.onSuccess?.(data, artifact);
    },
    onError: options?.onError,
  });
};

export const artifactDetailQueryOptions = ({
  href,
  options,
}: {
  href: string;
  options?: Omit<
    UseQueryOptions<ArtifactResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<ArtifactResponse, DrfAxiosError>({
    ...options,
    queryKey: artifactKeys.detailQuery(href),
    queryFn: async (): Promise<ArtifactResponse> => {
      const response = await axiosInstance.get<ArtifactResponse>(
        toProxyHref(href),
      );
      return response.data;
    },
  });

export const useArtifactDetailQuery = ({ href }: { href: string }) =>
  useQuery({
    ...artifactDetailQueryOptions({ href }),
    enabled: !!href,
  });
