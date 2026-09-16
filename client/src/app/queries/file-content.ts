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
  ContentFileFilesListData,
  FileFileContentResponse,
  FileFileContentWritable,
  PaginatedfileFileContentResponseList,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";
import { buildContentHref, isEmptyDetailPayload } from "./utils/pulpHref";

import { contentRootQueryOptions } from "./content";

export type IFileContentListParams = ListParams<ContentFileFilesListData>;

export const fileContentListQueryOptions = (
  domain: IPulpDomain,
  params: IFileContentListParams,
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
              ...params,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        );
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });

export const useFileContentListQuery = (
  params: IFileContentListParams,
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
      if (isEmptyDetailPayload(response.data) || !response.data.pulp_href) {
        throw new Error("Empty file content detail response");
      }
      return response.data;
    },
    enabled: !!href,
  });

export const useFileContentDetailQuery = (contentId: string) => {
  const domain = useApiDomain();
  return useQuery(
    fileContentDetailQueryOptions(buildContentHref(contentId, domain)),
  );
};

export const useSuspenseFileContentDetailQuery = (contentId: string) => {
  const domain = useApiDomain();
  return useSuspenseQuery(
    fileContentDetailQueryOptions(buildContentHref(contentId, domain)),
  );
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
