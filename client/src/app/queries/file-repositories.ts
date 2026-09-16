import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  FileFileRepository,
  FileFileRepositoryResponse,
  PaginatedRepositoryVersionResponseList,
  PatchedfileFileRepository,
  RepositoriesFileFileVersionsListData,
  RepositorySyncUrl,
  RepositoryVersionResponse,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { fetchAllPages } from "./utils/fetchAllPages";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import { buildRepositoryHref, isEmptyDetailPayload } from "./utils/pulpHref";

import { repositoriesRootQueryOptions } from "./repositories";

export const fileRepositoryDetailQueryOptions = (href: string) =>
  queryOptions({
    queryKey: [
      ...repositoriesRootQueryOptions.queryKey,
      "file",
      "detail",
      href,
    ],
    queryFn: async (): Promise<FileFileRepositoryResponse> => {
      const response = await axiosInstance.get<FileFileRepositoryResponse>(
        toProxyHref(href),
      );
      if (isEmptyDetailPayload(response.data) || !response.data.name) {
        throw new Error("Empty file repository detail response");
      }
      return response.data;
    },
    enabled: !!href,
  });

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

/**
 * Fetch-all fallback for the versions tab: it renders every version in one
 * table (no pagination UI), so page through the whole list.
 */
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

export const useFileRepositoryDetailQuery = (repoId: string) => {
  const domain = useApiDomain();
  return useQuery(
    fileRepositoryDetailQueryOptions(buildRepositoryHref(repoId, domain)),
  );
};

export const useSuspenseFileRepositoryDetailQuery = (repoId: string) => {
  const domain = useApiDomain();
  return useSuspenseQuery(
    fileRepositoryDetailQueryOptions(buildRepositoryHref(repoId, domain)),
  );
};

export const useFileRepositoryVersionsListQuery = (
  repoId: string,
  params: IFileRepositoryVersionsListParams,
) => {
  const domain = useApiDomain();
  return useQuery(
    fileRepositoryVersionsListQueryOptions(
      buildRepositoryHref(repoId, domain),
      params,
    ),
  );
};

export const useAllFileRepositoryVersionsListQuery = (repoId: string) => {
  const domain = useApiDomain();
  return useQuery(
    allFileRepositoryVersionsListQueryOptions(
      buildRepositoryHref(repoId, domain),
    ),
  );
};

export const useFileRepositoryCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async (body: FileFileRepository) => {
      const response = await axiosInstance.post<FileFileRepositoryResponse>(
        pulpApiPath("repositories/file/file/", domain),
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

export const useFileRepositoryUpdateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      body: PatchedfileFileRepository;
    }) => {
      const response = await axiosInstance.patch<
        FileFileRepositoryResponse | AsyncOperationResponse
      >(toProxyHref(href), body);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: repositoriesRootQueryOptions.queryKey,
      });
    },
  });
};

export const useFileRepositoryDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (href: string) => {
      const response = await axiosInstance.delete<AsyncOperationResponse>(
        toProxyHref(href),
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
