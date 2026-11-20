import { useMutation, useQueryClient } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  GenericRemoteResponse,
  PythonBanderRemoteWritable,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { remoteKeys } from "@app/queries/remotes";
import type { IMutationCallbacks } from "@app/queries/utils/mutationCallbacks";
import type { DrfAxiosError } from "@app/queries/utils/openapiErrorTypes";
import { pulpCollectionPath } from "@app/queries/utils/pulpApi";

import { python } from "../../definition";

const remote = python.remote["python.python"];

/** Creates a Python remote from a Bandersnatch config file (synchronous). */
export const useBandersnatchRemoteCreateMutation = (
  options?: IMutationCallbacks<
    GenericRemoteResponse,
    PythonBanderRemoteWritable
  >,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    GenericRemoteResponse,
    DrfAxiosError,
    PythonBanderRemoteWritable
  >({
    mutationFn: async ({ name, config, policy }) => {
      const form = new FormData();
      form.append("name", name);
      form.append("config", config);
      if (policy) form.append("policy", policy);
      return (
        await axiosInstance.post<GenericRemoteResponse>(
          pulpCollectionPath({
            collection: "remotes",
            apiPath: remote.apiPath,
            domain,
            action: remote.createFrom.bandersnatch.path,
          }),
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
