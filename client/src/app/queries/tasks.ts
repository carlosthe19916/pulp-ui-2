import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  PaginatedTaskResponseList,
  TaskResponse,
  TasksListData,
} from "@app/client";
import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";
import { isEmptyDetailPayload } from "./utils/pulpHref";

export const TasksQueryKey = "tasks";

export type TaskState =
  | "canceled"
  | "canceling"
  | "completed"
  | "failed"
  | "running"
  | "skipped"
  | "waiting";

type TaskOrdering = NonNullable<TasksListData["query"]>["ordering"];

interface ITaskListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<TaskOrdering>[number];
  state?: TaskState;
  state__in?: string[];
  name__contains?: string;
}

const isActiveTask = (state?: string | null) =>
  state === "running" || state === "waiting" || state === "canceling";

export const tasksRootQueryOptions = queryOptions({
  queryKey: [TasksQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const tasksListQueryOptions = (
  domain: IPulpDomain,
  params: ITaskListParams = {},
) =>
  queryOptions({
    queryKey: [...tasksRootQueryOptions.queryKey, "list", domain, params],
    queryFn: async (): Promise<PaginatedTaskResponseList> => {
      const response = await axiosInstance.get<PaginatedTaskResponseList>(
        pulpApiPath("tasks/", domain),
        {
          params: {
            limit: params.limit ?? 20,
            offset: params.offset,
            ordering: params.ordering ? [params.ordering] : undefined,
            state: params.state,
            state__in: params.state__in,
            name__contains: params.name__contains,
          },
        },
      );
      if (!response.data) {
        throw new Error("Empty tasks list response");
      }
      return response.data;
    },
    refetchInterval: (query) => {
      const hasActive = query.state.data?.results?.some((t) =>
        isActiveTask(t.state),
      );
      return hasActive ? DEFAULT_REFETCH_INTERVAL : false;
    },
  });

export const taskDetailQueryOptions = (taskHref: string) =>
  queryOptions({
    queryKey: [...tasksRootQueryOptions.queryKey, "detail", taskHref],
    queryFn: async (): Promise<TaskResponse> => {
      const response = await axiosInstance.get<TaskResponse>(
        toProxyHref(taskHref),
      );
      if (isEmptyDetailPayload(response.data) || !response.data.name) {
        throw new Error("Empty task detail response");
      }
      return response.data;
    },
    enabled: !!taskHref,
    refetchInterval: (query) =>
      isActiveTask(query.state.data?.state) ? DEFAULT_REFETCH_INTERVAL : false,
  });

export const useTasksListQuery = (params: ITaskListParams = {}) => {
  const domain = useApiDomain();
  return useQuery(tasksListQueryOptions(domain, params));
};

export const useTaskDetailQuery = (taskHref: string) => {
  return useQuery(taskDetailQueryOptions(taskHref));
};

export const useTaskCancelMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskHref: string) => {
      const response = await axiosInstance.patch<TaskResponse>(
        toProxyHref(taskHref),
        { state: "canceled" },
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tasksRootQueryOptions.queryKey,
      });
    },
  });
};

export const useTaskPurgeMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async (body: {
      finished_before?: string;
      states?: Array<"completed" | "failed" | "canceled" | "skipped">;
    }) => {
      const response = await axiosInstance.post<AsyncOperationResponse>(
        pulpApiPath("tasks/purge/", domain),
        {
          finished_before: body.finished_before,
          states: body.states,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tasksRootQueryOptions.queryKey,
      });
    },
  });
};
