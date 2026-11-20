import { queryOptions, useQuery } from "@tanstack/react-query";

import type {
  PaginatedTaskScheduleResponseList,
  TaskSchedulesListData,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

import type { ListParams } from "./utils/listParams";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpGet } from "./utils/pulpRequest";

export const TaskSchedulesQueryKey = "task-schedules";

export type ITaskScheduleListParams = ListParams<TaskSchedulesListData>;

export const taskScheduleKeys = {
  all: () => [TaskSchedulesQueryKey] as const,
  list: () => [...taskScheduleKeys.all(), "list"] as const,
  listQuery: (domain: IPulpDomain, params: ITaskScheduleListParams) =>
    [...taskScheduleKeys.list(), domain, params] as const,
};

export const taskSchedulesListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: ITaskScheduleListParams;
}) =>
  queryOptions<PaginatedTaskScheduleResponseList, DrfAxiosError>({
    queryKey: taskScheduleKeys.listQuery(domain, params),
    queryFn: async () =>
      (
        await pulpGet({
          endpoint: "task-schedules/",
          domain,
          params: {
            ...params,
            ordering: params.ordering ? [params.ordering] : undefined,
          },
        })
      ).data,
  });

export const useTaskSchedulesListQuery = ({
  params,
}: {
  params: ITaskScheduleListParams;
}) => {
  const domain = useSelectedDomain();
  return useQuery(taskSchedulesListQueryOptions({ domain, params }));
};
