import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type {
  FileFileDistributionResponse,
  FileFileDistribution,
  PatchedfileFileDistribution,
} from "@app/client";
import {
  distributionsFileFileCreate,
  distributionsFileFileDelete,
  distributionsFileFilePartialUpdate,
  distributionsFileFileRead,
} from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

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
      const response = await distributionsFileFileRead({
        client,
        path: { file_file_distribution_href: href },
      });
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
  return useMutation({
    mutationFn: async (body: FileFileDistribution) => {
      const response = await distributionsFileFileCreate({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        body,
      });
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
      const response = await distributionsFileFilePartialUpdate({
        client,
        path: { file_file_distribution_href: href },
        body,
      });
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
      const response = await distributionsFileFileDelete({
        client,
        path: { file_file_distribution_href: href },
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: distributionsRootQueryOptions.queryKey,
      });
    },
  });
};
