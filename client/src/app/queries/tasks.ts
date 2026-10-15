import {
  queryOptions,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
  type UseQueryResult,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  PaginatedTaskResponseList,
  TaskResponse,
  TasksListData,
} from "@app/client";
import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
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

/**
 * Query-key factory mirroring the REST paths. `domain` is the Pulp deployment
 * slug that scopes every API path. Two tiers: folders (invalidateQueries
 * prefixes) and the real query keys built on them.
 */
export const taskKeys = {
  all: () => [TasksQueryKey] as const,
  list: () => [...taskKeys.all(), "list"] as const,
  detail: (taskHref: string) =>
    [...taskKeys.all(), "detail", taskHref] as const,
  // Per-row delete/update status, one query per on-screen resource PRN.
  byPrn: () => [...taskKeys.all(), "byPrn"] as const,

  listQuery: (domain: IPulpDomain, params: ITaskListParams) =>
    [...taskKeys.list(), domain, params] as const,
  detailQuery: (taskHref: string) => taskKeys.detail(taskHref),
  byPrnQuery: (domain: IPulpDomain, prn: string, limit: number) =>
    [...taskKeys.byPrn(), domain, prn, limit] as const,
};

/**
 * In-flight states plus terminal failures (to report a failed delete/update).
 * `completed`/`skipped` are omitted — a successful delete just drops the row.
 */
const PRN_TASK_STATES = [
  "running",
  "waiting",
  "canceling",
  "failed",
  "canceled",
] as const;

/**
 * Shared `GET tasks/`, re-wrapping the single `ordering` to the spec's array
 * form. The list and per-PRN queries share it but keep their own keys/shapes.
 */
const fetchTasksPage = async (
  domain: IPulpDomain,
  params: ITaskListParams,
): Promise<PaginatedTaskResponseList> => {
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
};

/**
 * In-flight (and recently-failed) delete/update tasks per resource, one query
 * per PRN, flattened into a single `TaskResponse[]`. Each row polls its own PRN
 * because the task API has no OR-across-resources filter; status is
 * server-derived, so it survives reloads.
 */
export const useTasksByPrnQueries = ({
  prns,
  limit,
}: {
  prns: string[];
  /** Max recent tasks fetched per PRN. */
  limit: number;
}): TaskResponse[] => {
  const domain = useSelectedDomain();
  return useQueries({
    queries: prns.map((prn) =>
      queryOptions({
        queryKey: taskKeys.byPrnQuery(domain, prn, limit),
        queryFn: async (): Promise<TaskResponse[]> => {
          const page = await fetchTasksPage(domain, {
            reserved_resources: prn,
            state__in: [...PRN_TASK_STATES],
            fields: ["pulp_href", "state", "name", "reserved_resources_record"],
            ordering: "-pulp_created",
            limit,
          });
          return page.results ?? [];
        },
        enabled: !!prn,
        refetchInterval: (query) => {
          return query.state.data?.some((task) => isActiveTask(task.state))
            ? DEFAULT_REFETCH_INTERVAL
            : false;
        },
      }),
    ),
    combine: (results: UseQueryResult<TaskResponse[]>[]): TaskResponse[] => {
      return results.flatMap((result) => result.data ?? []);
    },
  });
};

export const tasksListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: ITaskListParams;
}) =>
  queryOptions({
    queryKey: taskKeys.listQuery(domain, params),
    queryFn: () => fetchTasksPage(domain, params),
  });

export const taskDetailQueryOptions = ({ taskHref }: { taskHref: string }) =>
  queryOptions({
    queryKey: taskKeys.detailQuery(taskHref),
    queryFn: async (): Promise<TaskResponse> => {
      const response = await axiosInstance.get<TaskResponse>(
        toProxyHref(taskHref),
      );
      return response.data;
    },
  });

export const useTasksListQuery = ({ params }: { params: ITaskListParams }) => {
  const domain = useDefaultDomain();
  return useQuery({
    ...tasksListQueryOptions({ domain, params }),
    refetchInterval: (query) =>
      query.state.data?.results?.some((task) => isActiveTask(task.state))
        ? DEFAULT_REFETCH_INTERVAL
        : false,
  });
};

export const useTaskDetailQuery = ({ taskId }: { taskId: string }) => {
  const taskHref = buildTaskHref(taskId);
  return useQuery({
    ...taskDetailQueryOptions({ taskHref }),
    enabled: !!taskHref,
    refetchInterval: (query) =>
      isActiveTask(query.state.data?.state) ? DEFAULT_REFETCH_INTERVAL : false,
  });
};

export const useSuspenseTaskDetailQuery = ({ taskId }: { taskId: string }) => {
  return useSuspenseQuery({
    ...taskDetailQueryOptions({ taskHref: buildTaskHref(taskId) }),
    refetchInterval: (query) =>
      isActiveTask(query.state.data?.state) ? DEFAULT_REFETCH_INTERVAL : false,
  });
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
  const domain = useDefaultDomain();
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
