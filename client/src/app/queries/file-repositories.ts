import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
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
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import { isEmptyDetailPayload } from "./utils/pulpHref";

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

type RepositoryVersionOrdering = NonNullable<
  RepositoriesFileFileVersionsListData["query"]
>["ordering"];

interface FileRepositoryVersionsListParams {
  limit?: number;
  offset?: number;
  number?: number;
  ordering?: NonNullable<RepositoryVersionOrdering>;
}

export const fileRepositoryVersionsListQueryOptions = (
  repoHref: string,
  params?: FileRepositoryVersionsListParams,
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
              limit: params?.limit ?? 20,
              offset: params?.offset,
              number: params?.number,
              ordering: params?.ordering,
            },
          },
        );
      if (!response.data) {
        throw new Error("Empty file repository versions list response");
      }
      return response.data;
    },
    enabled: !!repoHref,
  });

export const useFileRepositoryDetailQuery = (href: string) => {
  return useQuery(fileRepositoryDetailQueryOptions(href));
};

export const useFileRepositoryVersionsListQuery = (
  repoHref: string,
  params?: FileRepositoryVersionsListParams,
) => {
  return useQuery(fileRepositoryVersionsListQueryOptions(repoHref, params));
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
