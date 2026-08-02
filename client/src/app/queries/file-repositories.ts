import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type {
  FileFileRepository,
  FileFileRepositoryResponse,
  PaginatedRepositoryVersionResponseList,
  PatchedfileFileRepository,
  RepositorySyncUrl,
} from "@app/client";
import {
  repositoriesFileFileCreate,
  repositoriesFileFileDelete,
  repositoriesFileFilePartialUpdate,
  repositoriesFileFileRead,
  repositoriesFileFileSync,
  repositoriesFileFileVersionsList,
} from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";
import { isEmptyDetailPayload } from "@app/utils/pulpHref";

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
      const response = await repositoriesFileFileRead({
        client,
        path: { file_file_repository_href: href },
      });
      if (isEmptyDetailPayload(response.data) || !response.data.name) {
        throw new Error("Empty file repository detail response");
      }
      return response.data;
    },
    enabled: !!href,
  });

type RepositoryVersionOrdering = NonNullable<
  Parameters<typeof repositoriesFileFileVersionsList>[0]["query"]
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
      const response = await repositoriesFileFileVersionsList({
        client,
        path: { file_file_repository_href: repoHref },
        query: {
          limit: params?.limit ?? 20,
          offset: params?.offset,
          number: params?.number,
          ordering: params?.ordering,
        },
      });
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
  return useMutation({
    mutationFn: async (body: FileFileRepository) => {
      const response = await repositoriesFileFileCreate({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        body,
      });
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
      const response = await repositoriesFileFilePartialUpdate({
        client,
        path: { file_file_repository_href: href },
        body,
      });
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
      const response = await repositoriesFileFileDelete({
        client,
        path: { file_file_repository_href: href },
      });
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
      const response = await repositoriesFileFileSync({
        client,
        path: { file_file_repository_href: repoHref },
        body,
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: repositoriesRootQueryOptions.queryKey,
      });
    },
  });
};
