import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type { PaginatedWorkerResponseList, WorkersListData } from "@app/client";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";

import type { ListParams } from "./utils/listParams";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath } from "./utils/pulpApi";

export const WorkersQueryKey = "workers";

export type IWorkerListParams = ListParams<WorkersListData>;

export const workerKeys = {
  all: () => [WorkersQueryKey] as const,
  list: () => [...workerKeys.all(), "list"] as const,
  listQuery: (domain: IPulpDomain, params: IWorkerListParams) =>
    [...workerKeys.list(), domain, params] as const,
};

export const workersListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IWorkerListParams;
}) =>
  queryOptions<PaginatedWorkerResponseList, DrfAxiosError>({
    queryKey: workerKeys.listQuery(domain, params),
    queryFn: async () =>
      (
        await axiosInstance.get<PaginatedWorkerResponseList>(
          pulpApiPath("workers/", domain),
          {
            params: {
              ...params,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        )
      ).data,
    // Heartbeats move; keep the dashboard current.
    refetchInterval: 30_000,
  });

/** Workers are instance-wide; listed through the default domain. */
export const useWorkersListQuery = ({
  params,
}: {
  params: IWorkerListParams;
}) => {
  const domain = useDefaultDomain();
  return useQuery(workersListQueryOptions({ domain, params }));
};
