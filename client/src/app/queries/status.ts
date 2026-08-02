import { useQuery } from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type { StatusResponse } from "@app/client";
import { statusRead } from "@app/client";

import { mockQueryFn } from "./helpers";
import { statusMock } from "./mocks/status.mock";

export const StatusQueryKey = "pulp-status";

export const useStatusQuery = () => {
  return useQuery({
    queryKey: [StatusQueryKey],
    queryFn: (): Promise<StatusResponse> =>
      mockQueryFn(async () => {
        const response = await statusRead({ client });
        return response.data;
      }, statusMock),
    staleTime: 5 * 60 * 1000,
  });
};
