import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type { PaginatedTaskResponseList, TaskResponse } from "@app/client";
import { tasksList, tasksRead, tasksCancel, tasksPurge } from "@app/client";
import { DEFAULT_REFETCH_INTERVAL, PULP_DOMAIN } from "@app/Constants";
import { isEmptyDetailPayload } from "@app/utils/pulpHref";

export const TasksQueryKey = "tasks";

export type TaskState =
  | "canceled"
  | "canceling"
  | "completed"
  | "failed"
  | "running"
  | "skipped"
  | "waiting";

type TaskOrdering = NonNullable<
  Parameters<typeof tasksList>[0]["query"]
>["ordering"];

interface TaskListParams {
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

export const tasksListQueryOptions = (params: TaskListParams = {}) =>
  queryOptions({
    queryKey: [...tasksRootQueryOptions.queryKey, "list", params],
    queryFn: async (): Promise<PaginatedTaskResponseList> => {
      const response = await tasksList({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        query: {
          limit: params.limit ?? 20,
          offset: params.offset,
          ordering: params.ordering ? [params.ordering] : undefined,
          state: params.state,
          state__in: params.state__in,
          name__contains: params.name__contains,
        },
      });
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
      const response = await tasksRead({
        client,
        path: { task_href: taskHref },
      });
      if (isEmptyDetailPayload(response.data) || !response.data.name) {
        throw new Error("Empty task detail response");
      }
      return response.data;
    },
    enabled: !!taskHref,
    refetchInterval: (query) =>
      isActiveTask(query.state.data?.state) ? DEFAULT_REFETCH_INTERVAL : false,
  });

export const useTasksListQuery = (params: TaskListParams = {}) => {
  return useQuery(tasksListQueryOptions(params));
};

export const useTaskDetailQuery = (taskHref: string) => {
  return useQuery(taskDetailQueryOptions(taskHref));
};

export const useTaskCancelMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskHref: string) => {
      const response = await tasksCancel({
        client,
        path: { task_href: taskHref },
        body: { state: "canceled" },
      });
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
  return useMutation({
    mutationFn: async (body: {
      finished_before?: string;
      states?: Array<"completed" | "failed" | "canceled" | "skipped">;
    }) => {
      const response = await tasksPurge({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        body: {
          finished_before: body.finished_before,
          states: body.states,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tasksRootQueryOptions.queryKey,
      });
    },
  });
};
