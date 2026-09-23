import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
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
import { buildPublicationHref } from "./utils/pulpHref";

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
      return response.data;
    },
    enabled: !!href,
  });

export const useFilePublicationDetailQuery = (pubId: string) => {
  const domain = useApiDomain();
  return useQuery(
    filePublicationDetailQueryOptions(buildPublicationHref(pubId, domain)),
  );
};

export const useSuspenseFilePublicationDetailQuery = (pubId: string) => {
  const domain = useApiDomain();
  return useSuspenseQuery(
    filePublicationDetailQueryOptions(buildPublicationHref(pubId, domain)),
  );
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
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async (pubId: string) => {
      const response = await axiosInstance.delete<AsyncOperationResponse>(
        toProxyHref(buildPublicationHref(pubId, domain)),
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
