import { useMutation, useQueryClient } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type { GenericRemoteResponse } from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { remoteKeys } from "./remotes";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath } from "./utils/pulpApi";

export interface IBandersnatchRemoteVariables {
  name: string;
  config: File;
  policy?: string;
}

/** Creates a Python remote from a Bandersnatch config file (synchronous). */
export const useBandersnatchRemoteCreateMutation = (
  options?: IMutationCallbacks<
    GenericRemoteResponse,
    IBandersnatchRemoteVariables
  >,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    GenericRemoteResponse,
    DrfAxiosError,
    IBandersnatchRemoteVariables
  >({
    mutationFn: async ({ name, config, policy }) => {
      const form = new FormData();
      form.append("name", name);
      form.append("config", config);
      if (policy) form.append("policy", policy);
      return (
        await axiosInstance.post<GenericRemoteResponse>(
          pulpApiPath("remotes/python/python/from_bandersnatch/", domain),
          form,
        )
      ).data;
    },
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: remoteKeys.list() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};
