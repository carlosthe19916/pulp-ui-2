import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type { StatusResponse } from "@app/client";

import type { DrfAxiosError } from "./utils/openapiErrorTypes";

export const StatusQueryKey = "pulp-status";

export const statusQueryOptions = queryOptions<StatusResponse, DrfAxiosError>({
  queryKey: [StatusQueryKey],
  queryFn: async () => {
    const response = await axiosInstance.get<StatusResponse>(
      `/api/pulp/api/v3/status/`,
    );
    return response.data;
  },
  staleTime: 5 * 60 * 1000,
});

export const useStatusQuery = () => {
  return useQuery(statusQueryOptions);
};
