import {
  queryOptions,
  useMutation,
  useQueries,
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

/** The async (202 + task) operations surfaced per list row. */
export type EntityTaskKind = "delete" | "update";

/**
 * Maps a Pulp task name to the per-row operation it represents, or `null` when
 * it isn't one we surface in the list (e.g. a sync). Pulp names the async generic
 * operations `…ageneral_delete` / `…ageneral_update`.
 */
export const entityTaskKindFromName = (
  name?: string | null,
): EntityTaskKind | null => {
  const taskName = name ?? "";
  if (taskName.includes("general_delete")) return "delete";
  if (taskName.includes("general_update")) return "update";
  return null;
};

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
  // ["tasks", "entityOps"] — the per-row delete/update status query
  entityOps: () => [...taskKeys.all(), "entityOps"] as const,

  // --- real query keys (for useQuery / queryOptions) ---
  // ["tasks", "list", domain, params]
  listQuery: (domain: IPulpDomain, params: ITaskListParams) =>
    [...taskKeys.list(), domain, params] as const,
  // ["tasks", "detail", taskHref] — same value as detail() (no params)
  detailQuery: (taskHref: string) => taskKeys.detail(taskHref),
  // ["tasks", "entityOps", domain, prn] — the per-row delete/update status query,
  // one per on-screen resource (joined to its row by reserved-resource PRN).
  entityOpsForResource: (domain: IPulpDomain, prn: string) =>
    [...taskKeys.entityOps(), domain, prn] as const,
};

/**
 * Task states worth surfacing per list row: still in-flight, plus the terminal
 * failures (so a failed delete/update can be reported). `completed`/`skipped`
 * are excluded — a successful delete just drops the row.
 */
const ENTITY_OP_TASK_STATES = [
  "running",
  "waiting",
  "canceling",
  "failed",
  "canceled",
] as const;

/**
 * Active (and recently-failed) tasks reserving a single resource, used to derive
 * that row's delete/update status on the list pages. Server-derived — so the
 * status survives browser reloads and navigation — and scoped to the row's PRN so
 * the result can never be crowded out by unrelated tasks (the task API has no
 * OR-across-resources filter, so each row polls its own). The row join and
 * failure toasts live in `useResourceTasks`. Polls while this resource has an
 * active task, then stops.
 */
export const entityOpsForResourceQueryOptions = (
  domain: IPulpDomain,
  prn: string,
) =>
  queryOptions({
    queryKey: taskKeys.entityOpsForResource(domain, prn),
    queryFn: async (): Promise<TaskResponse[]> => {
      const response = await axiosInstance.get<PaginatedTaskResponseList>(
        pulpApiPath("tasks/", domain),
        {
          params: {
            // `reserved_resources` matches by PRN (not href) and ANDs with the
            // other filters; scoping to one resource keeps its task history short.
            reserved_resources: prn,
            state__in: ENTITY_OP_TASK_STATES,
            fields:
              "pulp_href,state,name,reserved_resources_record,finished_at",
            ordering: ["-pulp_created"],
            limit: 10,
          },
        },
      );
      return response.data.results ?? [];
    },
    enabled: !!prn,
    refetchInterval: (query) =>
      query.state.data?.some((task) => isActiveTask(task.state))
        ? DEFAULT_REFETCH_INTERVAL
        : false,
  });

/**
 * One scoped task query per resource PRN (there is no OR-across-resources filter),
 * combined into a single flat, href-deduped `TaskResponse[]` so callers keep a
 * simple list shape. Resolves the domain with `useSelectedDomain()` — the selected
 * content domain, or the default off a content route (and off the domains route,
 * where domain CRUD tasks live) — matching the list pages that show per-row status.
 */
// TODO instead of useQueries wrap each row of the Entity and fetch their resources independently
export const useEntityOpsTasksQueries = (prns: string[]): TaskResponse[] => {
  const domain = useSelectedDomain();
  return useQueries({
    queries: prns.map((prn) => entityOpsForResourceQueryOptions(domain, prn)),
    combine: (results) => {
      const byHref = new Map<string, TaskResponse>();
      for (const result of results) {
        for (const task of result.data ?? []) {
          if (task.pulp_href) byHref.set(task.pulp_href, task);
        }
      }
      return [...byHref.values()];
    },
  });
};

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
  const domain = useDefaultDomain();
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
