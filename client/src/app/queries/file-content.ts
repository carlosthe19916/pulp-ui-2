import {
  queryOptions,
  useMutation,
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
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { ListParams } from "./utils/listParams";
import { entityDetailQueryOptions } from "./utils/entityCrud";
import { pulpApiPath } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";
import { buildContentHref } from "./utils/pulpHref";

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

export const useSuspenseFileContentDetailQuery = (contentId: string) => {
  const domain = useSelectedDomain();
  return useSuspenseQuery(
    entityDetailQueryOptions<FileFileContentResponse>(
      contentRootQueryOptions.queryKey,
      buildContentHref(contentId, domain),
    ),
  );
};

export const useFileContentCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useSelectedDomain();
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
