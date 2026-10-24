import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type { TaskGroupResponse } from "@app/client";
import { DEFAULT_REFETCH_INTERVAL } from "@app/constants";

import { taskKeys } from "./tasks";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpHref, toProxyHref } from "./utils/pulpApi";

export const TaskGroupsQueryKey = "task-groups";

export const taskGroupKeys = {
  all: () => [TaskGroupsQueryKey] as const,
  detail: (href: string) => [...taskGroupKeys.all(), "detail", href] as const,
};

export const buildTaskGroupHref = (id: string, domain: IPulpDomain): string =>
  pulpHref(`task-groups/${id}/`, domain);

/** A task group's counts, polled while any of its tasks is unfinished. */
export const taskGroupDetailQueryOptions = ({ href }: { href: string }) =>
  queryOptions<TaskGroupResponse, DrfAxiosError>({
    queryKey: taskGroupKeys.detail(href),
    queryFn: async () =>
      (await axiosInstance.get<TaskGroupResponse>(toProxyHref(href))).data,
    refetchInterval: (query) => {
      const group = query.state.data;
      const unfinished =
        (group?.waiting ?? 0) + (group?.running ?? 0) + (group?.canceling ?? 0);
      return unfinished > 0 ? DEFAULT_REFETCH_INTERVAL : false;
    },
  });

export const useSuspenseTaskGroupDetailQuery = ({ href }: { href: string }) =>
  useSuspenseQuery(taskGroupDetailQueryOptions({ href }));

/** Cancels every unfinished task of the group. */
export const useTaskGroupCancelMutation = (
  options?: IMutationCallbacks<TaskGroupResponse, string>,
) => {
  const queryClient = useQueryClient();
  return useMutation<TaskGroupResponse, DrfAxiosError, string>({
    mutationFn: async (href) =>
      (
        await axiosInstance.patch<TaskGroupResponse>(toProxyHref(href), {
          state: "canceled",
        })
      ).data,
    onSuccess: (data, href) => {
      void queryClient.invalidateQueries({
        queryKey: taskGroupKeys.detail(href),
      });
      void queryClient.invalidateQueries({ queryKey: taskKeys.all() });
      options?.onSuccess?.(data, href);
    },
    onError: options?.onError,
  });
};
