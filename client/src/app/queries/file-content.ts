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
} from "@app/client";
import { contentFileFilesCreate, contentFileFilesRead } from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

import { contentRootQueryOptions } from "./content";

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
