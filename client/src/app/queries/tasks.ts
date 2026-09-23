import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
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
import { buildTaskHref } from "@app/utils/taskHref";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const TasksQueryKey = "tasks";

export type TaskState =
  | "canceled"
  | "canceling"
  | "completed"
  | "failed"
  | "running"
  | "skipped"
  | "waiting";

export type ITaskListParams = ListParams<TasksListData>;

const isActiveTask = (state?: string | null) =>
  state === "running" || state === "waiting" || state === "canceling";

/** A task in a terminal state has finished (successfully or not) and won't change. */
export const isTerminalTaskState = (state?: string | null): boolean =>
  state === "completed" ||
  state === "failed" ||
  state === "canceled" ||
  state === "skipped";

export const tasksRootQueryOptions = queryOptions({
  queryKey: [TasksQueryKey],
  queryFn: async (): Promise<null> => null,
});

/**
 * Query-key factory mirroring the REST paths. `domain` below is the pulp
 * *deployment* domain (`IPulpDomain`, the slug that scopes every API path).
 * Identifying segments precede params so a prefix invalidates all variants of a
 * collection. Shared by the query options and mutations to prevent key drift.
 */
export const taskKeys = {
  // --- invalidation folders (prefixes for invalidateQueries) ---
  // ["tasks"]
  all: () => [TasksQueryKey] as const,
  // ["tasks", "list"] — every list query, any domain/params
  list: () => [...taskKeys.all(), "list"] as const,
  // ["tasks", "detail", taskHref]
  detail: (taskHref: string) =>
    [...taskKeys.all(), "detail", taskHref] as const,
  // ["tasks", "byIds"] — every watch-by-ids query
  byIds: () => [...taskKeys.all(), "byIds"] as const,

  // --- real query keys (for useQuery / queryOptions) ---
  // ["tasks", "list", domain, params]
  listQuery: (domain: IPulpDomain, params: ITaskListParams) =>
    [...taskKeys.list(), domain, params] as const,
  // ["tasks", "detail", taskHref] — same value as detail() (no params)
  detailQuery: (taskHref: string) => taskKeys.detail(taskHref),
  // ["tasks", "byIds", domain, taskIds]
  byIdsQuery: (domain: IPulpDomain, taskIds: string[]) =>
    [...taskKeys.byIds(), domain, taskIds] as const,
};

/** Poll a specific set of tasks (by id) until none are active — for watching in-flight operations. */
export const tasksByIdsQueryOptions = (
  domain: IPulpDomain,
  taskIds: string[],
) =>
  queryOptions({
    queryKey: taskKeys.byIdsQuery(domain, taskIds),
    queryFn: async (): Promise<TaskResponse[]> => {
      const response = await axiosInstance.get<PaginatedTaskResponseList>(
        pulpApiPath("tasks/", domain),
        {
          params: {
            pulp_id__in: taskIds.join(","),
            fields: "pulp_href,state",
            limit: 100,
          },
        },
      );
      return response.data.results ?? [];
    },
    enabled: taskIds.length > 0,
    refetchInterval: (query) =>
      query.state.data?.some((task) => isActiveTask(task.state))
        ? DEFAULT_REFETCH_INTERVAL
        : false,
  });

export const tasksListQueryOptions = (
  domain: IPulpDomain,
  params: ITaskListParams,
) =>
  queryOptions({
    queryKey: taskKeys.listQuery(domain, params),
    queryFn: async (): Promise<PaginatedTaskResponseList> => {
      const response = await axiosInstance.get<PaginatedTaskResponseList>(
        pulpApiPath("tasks/", domain),
        {
          params: {
            ...params,
            ordering: params.ordering ? [params.ordering] : undefined,
          },
        },
      );
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
    queryKey: taskKeys.detailQuery(taskHref),
    queryFn: async (): Promise<TaskResponse> => {
      const response = await axiosInstance.get<TaskResponse>(
        toProxyHref(taskHref),
      );
      return response.data;
    },
    enabled: !!taskHref,
    refetchInterval: (query) =>
      isActiveTask(query.state.data?.state) ? DEFAULT_REFETCH_INTERVAL : false,
  });

export const useTasksListQuery = (params: ITaskListParams) => {
  const domain = useApiDomain();
  return useQuery(tasksListQueryOptions(domain, params));
};

export const useTaskDetailQuery = (taskId: string) => {
  return useQuery(taskDetailQueryOptions(buildTaskHref(taskId)));
};

export const useSuspenseTaskDetailQuery = (taskId: string) => {
  return useSuspenseQuery(taskDetailQueryOptions(buildTaskHref(taskId)));
};

export const useTaskCancelMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await axiosInstance.patch<TaskResponse>(
        toProxyHref(buildTaskHref(taskId)),
        { state: "canceled" },
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all() });
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
      void queryClient.invalidateQueries({ queryKey: taskKeys.all() });
    },
  });
};
