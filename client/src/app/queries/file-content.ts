import { useMutation, useQueryClient } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  FileFileContentWritable,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath } from "./utils/pulpApi";

import { contentRootQueryOptions } from "./content";

/** Uploads a file content unit (file plugin). Returns the Pulp 202 task. */
export const useFileContentCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useSelectedDomain();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    FileFileContentWritable
  >({
    mutationFn: async (body: FileFileContentWritable) => {
      const response = await axiosInstance.post<AsyncOperationResponse>(
        pulpApiPath("content/file/files/", domain),
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: contentRootQueryOptions.queryKey,
      });
    },
  });
};
