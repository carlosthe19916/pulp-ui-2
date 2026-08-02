import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type {
  FileFilePublication,
  FileFilePublicationResponse,
} from "@app/client";
import {
  publicationsFileFileCreate,
  publicationsFileFileDelete,
  publicationsFileFileRead,
} from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

import { publicationsRootQueryOptions } from "./publications";

export const filePublicationDetailQueryOptions = (href: string) =>
  queryOptions({
    queryKey: [
      ...publicationsRootQueryOptions.queryKey,
      "file",
      "detail",
      href,
    ],
    queryFn: async (): Promise<FileFilePublicationResponse> => {
      const response = await publicationsFileFileRead({
        client,
        path: { file_file_publication_href: href },
      });
      if (!response.data) {
        throw new Error("Empty file publication detail response");
      }
      return response.data;
    },
    enabled: !!href,
  });

export const useFilePublicationDetailQuery = (href: string) => {
  return useQuery(filePublicationDetailQueryOptions(href));
};

export const useFilePublicationCreateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: FileFilePublication) => {
      const response = await publicationsFileFileCreate({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        body,
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: publicationsRootQueryOptions.queryKey,
      });
    },
  });
};

export const useFilePublicationDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (href: string) => {
      const response = await publicationsFileFileDelete({
        client,
        path: { file_file_publication_href: href },
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: publicationsRootQueryOptions.queryKey,
      });
    },
  });
};
