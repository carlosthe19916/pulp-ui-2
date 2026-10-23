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
  ProfileArtifactResponse,
  Purge,
  TaskResponse,
  TasksListData,
} from "@app/client";
import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { getTaskErrorMessage } from "@app/utils/utils";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
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

/** A task can be canceled only while still running or waiting. */
export const isCancelable = (state?: string | null): boolean =>
  state === "running" || state === "waiting";

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
  // Per-row delete/update status probe, one query per on-screen resource PRN.
  byPrn: () => [...taskKeys.all(), "byPrn"] as const,
  // Paginated task list scoped to a single resource PRN (the expanded row table).
  byPrnList: () => [...taskKeys.all(), "byPrnList"] as const,

  listQuery: (domain: IPulpDomain, params: ITaskListParams) =>
    [...taskKeys.list(), domain, params] as const,
  detailQuery: (taskHref: string) => taskKeys.detail(taskHref),
  byPrnQuery: (domain: IPulpDomain, prn: string) =>
    [...taskKeys.byPrn(), domain, prn] as const,
  byPrnListQuery: (
    domain: IPulpDomain,
    prn: string,
    params: { limit: number; offset: number },
  ) => [...taskKeys.byPrnList(), domain, prn, params] as const,
};

/** Active states plus recent failures — for the expanded per-PRN task table. */
const PRN_TASK_STATES = [
  "running",
  "waiting",
  "canceling",
  "failed",
  "canceled",
] as const;

/** Strictly-active states — the probe's `count` is the exact in-progress count. */
const PRN_ACTIVE_STATES = ["running", "waiting", "canceling"] as const;

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

/** Per-row probe result: the exact active-task count plus one sample task. */
export interface IPrnTaskProbe {
  /** Number of in-progress (running/waiting/canceling) tasks for the resource. */
  count: number;
  /** The most recent active task — present whenever `count > 0`. */
  task?: TaskResponse;
}

/**
 * Per-PRN in-flight probe, one query each (the task API has no OR-across-resources
 * filter). Fetches `limit: 1` but reads the paginated `count`, giving the exact
 * active count plus a sample task without pulling the whole list.
 */
export const useTasksByPrnQueries = ({
  prns,
}: {
  prns: string[];
}): Map<string, IPrnTaskProbe> => {
  const domain = useSelectedDomain();
  return useQueries({
    queries: prns.map((prn) =>
      queryOptions<IPrnTaskProbe, DrfAxiosError>({
        queryKey: taskKeys.byPrnQuery(domain, prn),
        queryFn: async (): Promise<IPrnTaskProbe> => {
          const page = await fetchTasksPage(domain, {
            reserved_resources: prn,
            state__in: [...PRN_ACTIVE_STATES],
            fields: ["pulp_href", "state", "name"],
            ordering: "-pulp_created",
            limit: 1,
          });
          return { count: page.count ?? 0, task: page.results?.[0] };
        },
        enabled: !!prn,
        refetchInterval: (query) =>
          (query.state.data?.count ?? 0) > 0 ? DEFAULT_REFETCH_INTERVAL : false,
      }),
    ),
    combine: (
      results: UseQueryResult<IPrnTaskProbe, DrfAxiosError>[],
    ): Map<string, IPrnTaskProbe> => {
      const byPrn = new Map<string, IPrnTaskProbe>();
      prns.forEach((prn, index) => {
        const data = results[index]?.data;
        if (data) byPrn.set(prn, data);
      });
      return byPrn;
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
  queryOptions<PaginatedTaskResponseList, DrfAxiosError>({
    queryKey: taskKeys.listQuery(domain, params),
    queryFn: () => fetchTasksPage(domain, params),
  });

export const taskDetailQueryOptions = ({ taskHref }: { taskHref: string }) =>
  queryOptions<TaskResponse, DrfAxiosError>({
    queryKey: taskKeys.detailQuery(taskHref),
    queryFn: async (): Promise<TaskResponse> => {
      const response = await axiosInstance.get<TaskResponse>(
        toProxyHref(taskHref),
      );
      return response.data;
    },
  });

/**
 * Polls a dispatched task until it ends and returns it; rejects with the task's
 * failure detail. For a mutation that must hand back what the task created.
 */
export const waitForTask = async (taskHref: string): Promise<TaskResponse> => {
  for (;;) {
    const { data: task } = await axiosInstance.get<TaskResponse>(
      toProxyHref(taskHref),
    );
    if (task.state === "completed") return task;
    if (isTerminalTaskState(task.state)) {
      throw new Error(getTaskErrorMessage(task) ?? `Task ${task.state}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

/** Poll result for one task href: its latest state and whether it 404'd (purged). */
export interface ITaskStateProbe {
  state?: string;
  notFound: boolean;
  /** The task's failure detail, when it ended in `failed` (see `getTaskErrorMessage`). */
  errorMessage?: string;
  /** Hrefs the task created (e.g. a new repository version). */
  createdResources: readonly string[];
}

/**
 * Polls a set of task hrefs (one query each) until each is terminal or 404s
 * (purged); keeps polling through transient errors. Returns a Map keyed by href.
 * Tracks dispatched tasks with no on-screen row yet (e.g. in-flight creates).
 */
export const useTaskDetailQueries = ({
  taskHrefs,
}: {
  taskHrefs: string[];
}): Map<string, ITaskStateProbe> =>
  useQueries({
    queries: taskHrefs.map((taskHref) =>
      queryOptions<TaskResponse, DrfAxiosError>({
        ...taskDetailQueryOptions({ taskHref }),
        refetchInterval: (query) =>
          isTerminalTaskState(query.state.data?.state) ||
          query.state.error?.response?.status === 404
            ? false
            : DEFAULT_REFETCH_INTERVAL,
      }),
    ),
    combine: (
      results: UseQueryResult<TaskResponse, DrfAxiosError>[],
    ): Map<string, ITaskStateProbe> => {
      const byHref = new Map<string, ITaskStateProbe>();
      taskHrefs.forEach((taskHref, index) => {
        const result = results[index];
        byHref.set(taskHref, {
          state: result?.data?.state,
          notFound: result?.error?.response?.status === 404,
          errorMessage: getTaskErrorMessage(result?.data),
          createdResources: result?.data?.created_resources ?? [],
        });
      });
      return byHref;
    },
  });

export const useTasksListQuery = ({ params }: { params: ITaskListParams }) => {
  const domain = useSelectedDomain();
  return useQuery({
    ...tasksListQueryOptions({ domain, params }),
    refetchInterval: (query) =>
      query.state.data?.results?.some((task) => isActiveTask(task.state))
        ? DEFAULT_REFETCH_INTERVAL
        : false,
  });
};

export const tasksByPrnListQueryOptions = ({
  domain,
  prn,
  limit,
  offset,
}: {
  domain: IPulpDomain;
  prn: string;
  limit: number;
  offset: number;
}) =>
  queryOptions<PaginatedTaskResponseList, DrfAxiosError>({
    queryKey: taskKeys.byPrnListQuery(domain, prn, { limit, offset }),
    queryFn: () =>
      fetchTasksPage(domain, {
        reserved_resources: prn,
        state__in: [...PRN_TASK_STATES],
        fields: [
          "pulp_href",
          "name",
          "state",
          "pulp_created",
          "reserved_resources_record",
        ],
        ordering: "-pulp_created",
        limit,
        offset,
      }),
  });

/** Paginated task list for one PRN — the row's expanded table; polls while active. */
export const useTasksByPrnListQuery = ({
  prn,
  limit,
  offset,
}: {
  prn: string;
  limit: number;
  offset: number;
}) => {
  const domain = useSelectedDomain();
  return useQuery({
    ...tasksByPrnListQueryOptions({ domain, prn, limit, offset }),
    enabled: !!prn,
    refetchInterval: (query) =>
      query.state.data?.results?.some((task) => isActiveTask(task.state))
        ? DEFAULT_REFETCH_INTERVAL
        : false,
  });
};

export const useSuspenseTaskDetailQuery = ({
  taskHref,
}: {
  taskHref: string;
}) =>
  useSuspenseQuery({
    ...taskDetailQueryOptions({ taskHref }),
    refetchInterval: (query) =>
      isActiveTask(query.state.data?.state) ? DEFAULT_REFETCH_INTERVAL : false,
  });

export const useTaskCancelMutation = (
  options?: IMutationCallbacks<TaskResponse, string>,
) => {
  const queryClient = useQueryClient();
  return useMutation<TaskResponse, DrfAxiosError, string>({
    mutationFn: async (href: string) => {
      const response = await axiosInstance.patch<TaskResponse>(
        toProxyHref(href),
        { state: "canceled" },
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

/** Deletes a finished task record (204). */
export const useTaskDeleteMutation = (
  options?: IMutationCallbacks<void, string>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, string>({
    mutationFn: async (href: string) => {
      await axiosInstance.delete(toProxyHref(href));
    },
    onSuccess: async (data, href) => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.list() });
      await options?.onSuccess?.(data, href);
      queryClient.removeQueries({ queryKey: taskKeys.detail(href) });
    },
    onError: options?.onError,
  });
};

/** Download links for the profiling data a task recorded (when profiling was on). */
export const taskProfileArtifactsQueryOptions = ({
  taskHref,
}: {
  taskHref: string;
}) =>
  queryOptions<ProfileArtifactResponse, DrfAxiosError>({
    queryKey: [...taskKeys.detail(taskHref), "profile-artifacts"] as const,
    queryFn: async () =>
      (
        await axiosInstance.get<ProfileArtifactResponse>(
          `${toProxyHref(taskHref)}profile_artifacts/`,
        )
      ).data,
  });

export const useTaskProfileArtifactsQuery = ({
  taskHref,
}: {
  taskHref: string;
}) =>
  useQuery({
    ...taskProfileArtifactsQueryOptions({ taskHref }),
    enabled: !!taskHref,
  });

export const useTaskPurgeMutation = (
  options?: IMutationCallbacks<AsyncOperationResponse, Purge>,
) => {
  const queryClient = useQueryClient();
  const domain = useSelectedDomain();
  return useMutation<AsyncOperationResponse, DrfAxiosError, Purge>({
    mutationFn: async (body: Purge) => {
      const response = await axiosInstance.post<AsyncOperationResponse>(
        pulpApiPath("tasks/purge/", domain),
        {
          finished_before: body.finished_before,
          states: body.states,
        },
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};
