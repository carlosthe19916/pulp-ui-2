import { queryOptions, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

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
    const contentType = String(response.headers["content-type"] ?? "");
    if (!contentType.includes("application/json")) {
      // A misconfigured proxy answers 200 with an HTML page, not JSON.
      throw new AxiosError(
        "The Pulp API did not return JSON for /api/v3/status/ " +
          `(received "${contentType || "no content-type"}"). ` +
          "Check that PULP_API_URL and PULP_API_ROOT point to the Pulp API root.",
        AxiosError.ERR_BAD_RESPONSE,
        response.config,
        response.request,
        response,
      );
    }
    return response.data;
  },
  staleTime: 5 * 60 * 1000,
  // A non-JSON status response is a deterministic config error, not transient.
  retry: false,
});

/** `refetchInterval` keeps a health view current; the shared status otherwise stays cached. */
export const useStatusQuery = ({
  refetchInterval,
}: { refetchInterval?: number } = {}) => {
  return useQuery({ ...statusQueryOptions, refetchInterval });
};
