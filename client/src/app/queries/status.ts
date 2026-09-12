import { queryOptions, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosInstance } from "@app/axios-config/apiInit";
import type { StatusResponse } from "@app/client";

export const StatusQueryKey = "pulp-status";

export const statusQueryOptions = queryOptions<StatusResponse, AxiosError>({
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
