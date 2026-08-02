import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type {
  FileFileRemoteResponse,
  FileFileRemoteWritable,
  PatchedfileFileRemoteWritable,
} from "@app/client";
import {
  remotesFileFileCreate,
  remotesFileFileDelete,
  remotesFileFilePartialUpdate,
  remotesFileFileRead,
} from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

import { remotesRootQueryOptions } from "./remotes";

export const fileRemoteDetailQueryOptions = (href: string) =>
  queryOptions({
    queryKey: [...remotesRootQueryOptions.queryKey, "file", "detail", href],
    queryFn: async (): Promise<FileFileRemoteResponse> => {
      const response = await remotesFileFileRead({
        client,
        path: { file_file_remote_href: href },
      });
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
  return useMutation({
    mutationFn: async (body: FileFileRemoteWritable) => {
      const response = await remotesFileFileCreate({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        body,
      });
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
      const response = await remotesFileFilePartialUpdate({
        client,
        path: { file_file_remote_href: href },
        body,
      });
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
      const response = await remotesFileFileDelete({
        client,
        path: { file_file_remote_href: href },
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: remotesRootQueryOptions.queryKey,
      });
    },
  });
};
