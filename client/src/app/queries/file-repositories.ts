import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  PaginatedRepositoryVersionResponseList,
  RepositoriesFileFileVersionsListData,
  RepositorySyncUrl,
  RepositoryVersionResponse,
} from "@app/client";
import { fetchAllPages } from "./utils/fetchAllPages";
import type { ListParams } from "./utils/listParams";
import { toProxyHref } from "./utils/pulpApi";

import { repositoriesRootQueryOptions } from "./repositories";

export type IFileRepositoryVersionsListParams =
  ListParams<RepositoriesFileFileVersionsListData>;

export const fileRepositoryVersionsListQueryOptions = (
  repoHref: string,
  params: IFileRepositoryVersionsListParams,
) =>
  queryOptions({
    queryKey: [
      ...repositoriesRootQueryOptions.queryKey,
      "versions",
      repoHref,
      params,
    ],
    queryFn: async (): Promise<PaginatedRepositoryVersionResponseList> => {
      const response =
        await axiosInstance.get<PaginatedRepositoryVersionResponseList>(
          `${toProxyHref(repoHref)}versions/`,
          {
            params: {
              ...params,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        );
      return response.data;
    },
    enabled: !!repoHref,
  });

/** Versions tab renders every version in one table (no pagination UI), so page through all. */
export const allFileRepositoryVersionsListQueryOptions = (repoHref: string) =>
  queryOptions({
    queryKey: [
      ...repositoriesRootQueryOptions.queryKey,
      "versions",
      "all",
      repoHref,
    ],
    queryFn: async (): Promise<PaginatedRepositoryVersionResponseList> => {
      const { results, count } = await fetchAllPages<RepositoryVersionResponse>(
        async (offset, limit) => {
          const response =
            await axiosInstance.get<PaginatedRepositoryVersionResponseList>(
              `${toProxyHref(repoHref)}versions/`,
              { params: { offset, limit } },
            );
          return response.data;
        },
      );
      return { count, next: null, previous: null, results };
    },
    enabled: !!repoHref,
  });

export const useFileRepositoryVersionsListQuery = (
  repoHref: string,
  params: IFileRepositoryVersionsListParams,
) => useQuery(fileRepositoryVersionsListQueryOptions(repoHref, params));

export const useAllFileRepositoryVersionsListQuery = (repoHref: string) =>
  useQuery(allFileRepositoryVersionsListQueryOptions(repoHref));

export const useFileRepositorySyncMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      repoHref,
      body,
    }: {
      repoHref: string;
      body: RepositorySyncUrl;
    }) => {
      const response = await axiosInstance.post<AsyncOperationResponse>(
        `${toProxyHref(repoHref)}sync/`,
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: repositoriesRootQueryOptions.queryKey,
      });
    },
  });
};
