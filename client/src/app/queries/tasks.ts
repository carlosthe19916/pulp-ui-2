import { useCallback } from "react";

import {
  queryOptions,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
  useSuspenseQuery,
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
import { DEFAULT_REFETCH_INTERVAL } from "@app/constants";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { getTaskErrorMessage } from "@app/utils/utils";

import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath, pulpHref, toProxyHref } from "./utils/pulpApi";

export const TasksQueryKey = "tasks";

export type TaskState = NonNullable<
  NonNullable<TasksListData["query"]>["state"]
>;

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
 * Query-key factory mirroring the REST paths, in two tiers: folders (invalidation
 * prefixes) and the real query keys built on them.
 */
export const taskKeys = {
  all: () => [TasksQueryKey] as const,
  list: () => [...taskKeys.all(), "list"] as const,
  detail: (taskHref: string) =>
    [...taskKeys.all(), "detail", taskHref] as const,
  // Per-row delete/update status probe, one query per on-screen resource PRN.
  byPrn: () => [...taskKeys.all(), "byPrn"] as const,

  listQuery: (domain: IPulpDomain, params: ITaskListParams) =>
    [...taskKeys.list(), domain, params] as const,
  detailQuery: (taskHref: string) => taskKeys.detail(taskHref),
  byPrnQuery: (domain: IPulpDomain, prn: string) =>
    [...taskKeys.byPrn(), domain, prn] as const,
};

/**
 * Active states plus recent failures — the expanded per-PRN task table spreads them
 * into `state__in`.
 */
export const PRN_TASK_STATES = [
  "running",
  "waiting",
  "canceling",
  "failed",
  "canceled",
] as const satisfies readonly TaskState[];

/** Strictly-active states — the probe's `count` is the exact in-progress count. */
const PRN_ACTIVE_STATES = [
  "running",
  "waiting",
  "canceling",
] as const satisfies readonly TaskState[];

/**
 * Shared `GET tasks/`, re-wrapping the single `ordering` to the spec's array
 * form. The list and the per-PRN probe share it but keep their own keys/shapes.
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
 * One in-flight probe per PRN (the task API can't OR across resources); `limit: 1` plus
 * the paginated `count` gives the active count and a sample task.
 */
export const useTasksByPrnQueries = ({
  prns,
}: {
  prns: string[];
}): Map<string, IPrnTaskProbe> => {
  const domain = useSelectedDomain();
  // `combine` must be referentially stable or useQueries returns a new Map every
  // render; key it on the PRN list's content, not the (often fresh) array.
  const prnsKey = prns.join("\n");
  const combine = useCallback(
    (
      results: UseQueryResult<IPrnTaskProbe, DrfAxiosError>[],
    ): Map<string, IPrnTaskProbe> => {
      const byPrn = new Map<string, IPrnTaskProbe>();
      prnsKey.split("\n").forEach((prn, index) => {
        const data = results[index]?.data;
        if (data) byPrn.set(prn, data);
      });
      return byPrn;
    },
    [prnsKey],
  );
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
    combine,
  });
};

type TaskListOptions = Omit<
  UseQueryOptions<PaginatedTaskResponseList, DrfAxiosError>,
  "queryKey" | "queryFn"
>;

export const tasksListQueryOptions = ({
  domain,
  params,
  options,
}: {
  domain: IPulpDomain;
  params: ITaskListParams;
  options?: TaskListOptions;
}) =>
  queryOptions<PaginatedTaskResponseList, DrfAxiosError>({
    ...options,
    queryKey: taskKeys.listQuery(domain, params),
    queryFn: () => fetchTasksPage(domain, params),
  });

export const buildTaskHref = (taskId: string, domain: IPulpDomain): string =>
  pulpHref(`tasks/${taskId}/`, domain);

export const taskDetailQueryOptions = ({
  href,
  options,
}: {
  href: string;
  options?: Omit<
    UseQueryOptions<TaskResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<TaskResponse, DrfAxiosError>({
    ...options,
    queryKey: taskKeys.detailQuery(href),
    queryFn: async (): Promise<TaskResponse> => {
      const response = await axiosInstance.get<TaskResponse>(toProxyHref(href));
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
 * Polls task hrefs (one query each) until terminal or 404 (purged), through transient
 * errors; for dispatched tasks with no on-screen row yet.
 */
export const useTaskDetailQueries = ({
  taskHrefs,
}: {
  taskHrefs: string[];
}): Map<string, ITaskStateProbe> =>
  useQueries({
    queries: taskHrefs.map((taskHref) =>
      queryOptions<TaskResponse, DrfAxiosError>({
        ...taskDetailQueryOptions({ href: taskHref }),
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

/** Polls while any task on the page is still active. */
export const useTasksListQuery = ({
  params,
  options,
}: {
  params: ITaskListParams;
  options?: TaskListOptions;
}) => {
  const domain = useSelectedDomain();
  return useQuery({
    ...tasksListQueryOptions({ domain, params, options }),
    refetchInterval: (query) =>
      query.state.data?.results?.some((task) => isActiveTask(task.state))
        ? DEFAULT_REFETCH_INTERVAL
        : false,
  });
};

export const useTaskDetailQuery = ({ href }: { href: string }) =>
  useQuery({ ...taskDetailQueryOptions({ href }), enabled: !!href });

export const useSuspenseTaskDetailQuery = ({ href }: { href: string }) =>
  useSuspenseQuery({
    ...taskDetailQueryOptions({ href }),
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
  href,
  options,
}: {
  href: string;
  options?: Omit<
    UseQueryOptions<ProfileArtifactResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<ProfileArtifactResponse, DrfAxiosError>({
    ...options,
    queryKey: [...taskKeys.detail(href), "profile-artifacts"] as const,
    queryFn: async () =>
      (
        await axiosInstance.get<ProfileArtifactResponse>(
          `${toProxyHref(href)}profile_artifacts/`,
        )
      ).data,
  });

export const useTaskProfileArtifactsQuery = ({ href }: { href: string }) =>
  useQuery({
    ...taskProfileArtifactsQueryOptions({ href }),
    enabled: !!href,
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
