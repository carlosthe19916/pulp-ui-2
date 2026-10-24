import { useMutation, useQueryClient } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type { AsyncOperationResponse } from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

import { taskKeys } from "./tasks";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath } from "./utils/pulpApi";

/** Domain-wide maintenance operations; each starts a task. */
export type MaintenanceOperation =
  "orphans/cleanup/" | "repositories/reclaim_space/" | "repair/";

export interface IMaintenanceVariables {
  operation: MaintenanceOperation;
  body: Record<string, unknown>;
}

export const useMaintenanceMutation = (
  options?: IMutationCallbacks<AsyncOperationResponse, IMaintenanceVariables>,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    IMaintenanceVariables
  >({
    mutationFn: async ({ operation, body }) =>
      (
        await axiosInstance.post<AsyncOperationResponse>(
          pulpApiPath(operation, domain),
          body,
        )
      ).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.list() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};
