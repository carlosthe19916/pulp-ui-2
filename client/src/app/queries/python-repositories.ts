import { useMutation, useQueryClient } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedpythonPythonBlocklistEntryResponseList,
  PythonPythonBlocklistEntry,
  PythonPythonBlocklistEntryResponse,
} from "@app/client";
import { repositoryKeys, useRepositorySubResourceQuery } from "./repositories";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { toProxyHref } from "./utils/pulpApi";

const BLOCKLIST_PATH = "blocklist_entries/";

/** A Python repository's blocklist; nested under its detail key. */
const blocklistKey = (repositoryHref: string) =>
  [...repositoryKeys.detail(repositoryHref), BLOCKLIST_PATH] as const;

export const usePythonBlocklistQuery = ({
  repositoryHref,
  params,
}: {
  repositoryHref: string;
  params: { limit: number; offset: number };
}) =>
  useRepositorySubResourceQuery<
    PaginatedpythonPythonBlocklistEntryResponseList,
    { limit: number; offset: number }
  >({ repositoryHref, path: BLOCKLIST_PATH, params });

export const usePythonBlocklistCreateMutation = (
  options?: IMutationCallbacks<
    PythonPythonBlocklistEntryResponse,
    { repositoryHref: string; body: PythonPythonBlocklistEntry }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    PythonPythonBlocklistEntryResponse,
    DrfAxiosError,
    { repositoryHref: string; body: PythonPythonBlocklistEntry }
  >({
    mutationFn: async ({ repositoryHref, body }) =>
      (
        await axiosInstance.post<PythonPythonBlocklistEntryResponse>(
          `${toProxyHref(repositoryHref)}${BLOCKLIST_PATH}`,
          body,
        )
      ).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: blocklistKey(vars.repositoryHref),
      });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

export const usePythonBlocklistDeleteMutation = (
  options?: IMutationCallbacks<void, PythonPythonBlocklistEntryResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, PythonPythonBlocklistEntryResponse>({
    mutationFn: async (entry) => {
      await axiosInstance.delete(toProxyHref(entry.pulp_href ?? ""));
    },
    onSuccess: (data, entry) => {
      void queryClient.invalidateQueries({
        queryKey: blocklistKey(entry.repository ?? ""),
      });
      options?.onSuccess?.(data, entry);
    },
    onError: options?.onError,
  });
};
