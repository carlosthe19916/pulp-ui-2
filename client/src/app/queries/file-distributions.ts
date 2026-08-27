import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  FileFileDistribution,
  FileFileDistributionResponse,
  PatchedfileFileDistribution,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";

import { distributionsRootQueryOptions } from "./distributions";

export const fileDistributionDetailQueryOptions = (href: string) =>
  queryOptions({
    queryKey: [
      ...distributionsRootQueryOptions.queryKey,
      "file",
      "detail",
      href,
    ],
    queryFn: async (): Promise<FileFileDistributionResponse> => {
      const response = await axiosInstance.get<FileFileDistributionResponse>(
        toProxyHref(href),
      );
      if (!response.data) {
        throw new Error("Empty file distribution detail response");
      }
      return response.data;
    },
    enabled: !!href,
  });

export const useFileDistributionDetailQuery = (href: string) => {
  return useQuery(fileDistributionDetailQueryOptions(href));
};

export const useFileDistributionCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async (body: FileFileDistribution) => {
      const response = await axiosInstance.post<AsyncOperationResponse>(
        pulpApiPath("distributions/file/file/", domain),
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: distributionsRootQueryOptions.queryKey,
      });
    },
  });
};

export const useFileDistributionUpdateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      body: PatchedfileFileDistribution;
    }) => {
      const response = await axiosInstance.patch<AsyncOperationResponse>(
        toProxyHref(href),
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: distributionsRootQueryOptions.queryKey,
      });
    },
  });
};

export const useFileDistributionDeleteMutation = () => {
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
        queryKey: distributionsRootQueryOptions.queryKey,
      });
    },
  });
};
