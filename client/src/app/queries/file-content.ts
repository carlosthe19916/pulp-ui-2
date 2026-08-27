import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  FileFileContentResponse,
  FileFileContentWritable,
  PaginatedfileFileContentResponseList,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { PulpDomain } from "./utils/pulpApi";

import { contentRootQueryOptions } from "./content";

export interface FileContentListParams {
  limit?: number;
  offset?: number;
  repository_version?: string;
  relative_path__icontains?: string;
}

export const fileContentListQueryOptions = (
  domain: PulpDomain,
  params: FileContentListParams = {},
  options?: { enabled?: boolean },
) =>
  queryOptions({
    queryKey: [
      ...contentRootQueryOptions.queryKey,
      "file",
      "list",
      domain,
      params,
    ],
    queryFn: async (): Promise<PaginatedfileFileContentResponseList> => {
      const response =
        await axiosInstance.get<PaginatedfileFileContentResponseList>(
          pulpApiPath("content/file/files/", domain),
          {
            params: {
              limit: params.limit ?? 20,
              offset: params.offset,
              repository_version: params.repository_version,
              relative_path__icontains: params.relative_path__icontains,
            },
          },
        );
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
  const domain = useApiDomain();
  return useQuery(fileContentListQueryOptions(domain, params, options));
};

export const fileContentDetailQueryOptions = (href: string) =>
  queryOptions({
    queryKey: [...contentRootQueryOptions.queryKey, "file", "detail", href],
    queryFn: async (): Promise<FileFileContentResponse> => {
      const response = await axiosInstance.get<FileFileContentResponse>(
        toProxyHref(href),
      );
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
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async (body: FileFileContentWritable) => {
      const response = await axiosInstance.post<AsyncOperationResponse>(
        pulpApiPath("content/file/files/", domain),
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: contentRootQueryOptions.queryKey,
      });
    },
  });
};
