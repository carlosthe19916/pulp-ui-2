import { useMutation, useQueryClient } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type { AsyncOperationResponse, FileFilePublication } from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { pulpApiPath } from "./utils/pulpApi";

import { publicationsRootQueryOptions } from "./publications";

export const useFilePublicationCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useSelectedDomain();
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
