import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type { PaginatedTaskResponseList, TaskResponse } from "@app/client";
import { tasksList, tasksRead, tasksCancel, tasksPurge } from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

import { mockQueryFn } from "./helpers";
import { taskDetailMock, tasksMock } from "./mocks/tasks.mock";

export const TasksQueryKey = "tasks";

interface TaskListParams {
  limit?: number;
  offset?: number;
  ordering?: string;
  state?: string;
  state__in?: string[];
  name__contains?: string;
}

export const useTasksListQuery = (params: TaskListParams = {}) => {
  return useQuery({
    queryKey: [TasksQueryKey, "list", params],
    queryFn: (): Promise<PaginatedTaskResponseList> =>
      mockQueryFn(async () => {
        const response = await tasksList({
          client,
          path: { pulp_domain: PULP_DOMAIN },
          query: {
            limit: params.limit ?? 20,
            offset: params.offset,
            ordering: params.ordering
              ? ([params.ordering] as [string])
              : undefined,
            state: params.state as
              | "canceled"
              | "canceling"
              | "completed"
              | "failed"
              | "running"
              | "skipped"
              | "waiting"
              | undefined,
            state__in: params.state__in,
            name__contains: params.name__contains,
          },
        });
        return response.data;
      }, tasksMock),
  });
};

export const useTaskDetailQuery = (taskHref: string) => {
  return useQuery({
    queryKey: [TasksQueryKey, "detail", taskHref],
    queryFn: (): Promise<TaskResponse> =>
      mockQueryFn(async () => {
        const response = await tasksRead({
          client,
          path: { task_href: taskHref },
        });
        return response.data;
      }, taskDetailMock),
    enabled: !!taskHref,
  });
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
      queryClient.invalidateQueries({ queryKey: [TasksQueryKey] });
    },
  });
};

export const useTaskPurgeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await tasksPurge({
        client,
        path: { pulp_domain: PULP_DOMAIN },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TasksQueryKey] });
    },
  });
};
