import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type {
  FileFileContentResponse,
  FileFileContentWritable,
  PaginatedfileFileContentResponseList,
} from "@app/client";
import {
  contentFileFilesCreate,
  contentFileFilesList,
  contentFileFilesRead,
} from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

import { contentRootQueryOptions } from "./content";

export interface FileContentListParams {
  limit?: number;
  offset?: number;
  repository_version?: string;
  relative_path__icontains?: string;
}

export const fileContentListQueryOptions = (
  params: FileContentListParams = {},
  options?: { enabled?: boolean },
) =>
  queryOptions({
    queryKey: [...contentRootQueryOptions.queryKey, "file", "list", params],
    queryFn: async (): Promise<PaginatedfileFileContentResponseList> => {
      const response = await contentFileFilesList({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        query: {
          limit: params.limit ?? 20,
          offset: params.offset,
          repository_version: params.repository_version,
          relative_path__icontains: params.relative_path__icontains,
        },
      });
      if (!response.data) {
        throw new Error("Empty file content list response");
      }
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });

export const useFileContentListQuery = (
  params: FileContentListParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery(fileContentListQueryOptions(params, options));
};

export const fileContentDetailQueryOptions = (href: string) =>
  queryOptions({
    queryKey: [...contentRootQueryOptions.queryKey, "file", "detail", href],
    queryFn: async (): Promise<FileFileContentResponse> => {
      const response = await contentFileFilesRead({
        client,
        path: { file_file_content_href: href },
      });
      if (!response.data) {
        throw new Error("Empty file content detail response");
      }
      return response.data;
    },
    enabled: !!href,
  });

export const useFileContentDetailQuery = (href: string) => {
  return useQuery(fileContentDetailQueryOptions(href));
};

export const useFileContentCreateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: FileFileContentWritable) => {
      const response = await contentFileFilesCreate({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        body,
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: contentRootQueryOptions.queryKey,
      });
    },
  });
};
