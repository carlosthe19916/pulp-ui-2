import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
  useSuspenseQuery,
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
import { buildDistributionHref, isEmptyDetailPayload } from "./utils/pulpHref";

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
      if (isEmptyDetailPayload(response.data) || !response.data.name) {
        throw new Error("Empty file distribution detail response");
      }
      return response.data;
    },
    enabled: !!href,
  });

export const useFileDistributionDetailQuery = (distId: string) => {
  const domain = useApiDomain();
  return useQuery(
    fileDistributionDetailQueryOptions(buildDistributionHref(distId, domain)),
  );
};

export const useSuspenseFileDistributionDetailQuery = (distId: string) => {
  const domain = useApiDomain();
  return useSuspenseQuery(
    fileDistributionDetailQueryOptions(buildDistributionHref(distId, domain)),
  );
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
