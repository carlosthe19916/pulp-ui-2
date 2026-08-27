import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  FileFilePublication,
  FileFilePublicationResponse,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";

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
      const response = await axiosInstance.get<FileFilePublicationResponse>(
        toProxyHref(href),
      );
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
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async (body: FileFilePublication) => {
      const response = await axiosInstance.post<AsyncOperationResponse>(
        pulpApiPath("publications/file/file/", domain),
        body,
      );
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
      const response = await axiosInstance.delete<AsyncOperationResponse>(
        toProxyHref(href),
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: publicationsRootQueryOptions.queryKey,
      });
    },
  });
};
