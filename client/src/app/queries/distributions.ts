import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { client } from "@app/axios-config/apiInit";
import { distributionsList } from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

import { mockQueryFn } from "./helpers";
import { distributionsMock } from "./mocks/distributions.mock";

export const DistributionsQueryKey = "distributions";

export const useFetchDistributions = (disableQuery = false) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [DistributionsQueryKey],
    queryFn: () =>
      mockQueryFn(async () => {
        const response = await distributionsList({
          client,
          path: {
            pulp_domain: PULP_DOMAIN,
          },
        });
        return response.data;
      }, distributionsMock),
    enabled: !disableQuery,
  });

  return {
    distributions: data?.results || [],
    isFetching: isLoading,
    fetchError: error as AxiosError | null,
    refetch,
  };
};
