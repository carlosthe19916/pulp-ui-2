import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  FileFileRemoteResponse,
  FileFileRemoteWritable,
  PatchedfileFileRemoteWritable,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";

import { remotesRootQueryOptions } from "./remotes";

export const fileRemoteDetailQueryOptions = (href: string) =>
  queryOptions({
    queryKey: [...remotesRootQueryOptions.queryKey, "file", "detail", href],
    queryFn: async (): Promise<FileFileRemoteResponse> => {
      const response = await axiosInstance.get<FileFileRemoteResponse>(
        toProxyHref(href),
      );
      if (!response.data) {
        throw new Error("Empty file remote detail response");
      }
      return response.data;
    },
    enabled: !!href,
  });

export const useFileRemoteDetailQuery = (href: string) => {
  return useQuery(fileRemoteDetailQueryOptions(href));
};

export const useFileRemoteCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async (body: FileFileRemoteWritable) => {
      const response = await axiosInstance.post<FileFileRemoteResponse>(
        pulpApiPath("remotes/file/file/", domain),
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: remotesRootQueryOptions.queryKey,
      });
    },
  });
};

export const useFileRemoteUpdateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      body: PatchedfileFileRemoteWritable;
    }) => {
      const response = await axiosInstance.patch<
        FileFileRemoteResponse | AsyncOperationResponse
      >(toProxyHref(href), body);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: remotesRootQueryOptions.queryKey,
      });
    },
  });
};

export const useFileRemoteDeleteMutation = () => {
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
        queryKey: remotesRootQueryOptions.queryKey,
      });
    },
  });
};
