import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type { StatusResponse } from "@app/client";

export const StatusQueryKey = "pulp-status";

export const statusQueryOptions = queryOptions({
  queryKey: [StatusQueryKey],
  queryFn: async (): Promise<StatusResponse> => {
    const response = await axiosInstance.get<StatusResponse>(
      `/api/pulp/api/v3/status/`,
    );
    if (!response.data) {
      throw new Error("Empty status response");
    }
    return response.data;
  },
  staleTime: 5 * 60 * 1000,
});

export const useStatusQuery = () => {
  return useQuery(statusQueryOptions);
};
