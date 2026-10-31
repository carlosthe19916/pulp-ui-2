import type { UseQueryOptions } from "@tanstack/react-query";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedpythonPythonBlocklistEntryResponseList,
  PythonPythonBlocklistEntry,
  PythonPythonBlocklistEntryResponse,
  RepositoriesPythonPythonBlocklistEntriesListData,
} from "@app/client";

import { repositoryKeys } from "./repositories";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { toProxyHref } from "./utils/pulpApi";

const BLOCKLIST_PATH = "blocklist_entries/";

export type IPythonBlocklistListParams =
  ListParams<RepositoriesPythonPythonBlocklistEntriesListData>;

/** A Python repository's blocklist, nested under the repository's detail key. */
export const pythonRepositoryKeys = {
  blocklist: (repositoryHref: string) =>
    [...repositoryKeys.detail(repositoryHref), "blocklist_entries"] as const,

  blocklistQuery: (
    repositoryHref: string,
    params: IPythonBlocklistListParams,
  ) => [...pythonRepositoryKeys.blocklist(repositoryHref), params] as const,
};

export const pythonBlocklistQueryOptions = ({
  repositoryHref,
  params,
  options,
}: {
  repositoryHref: string;
  params: IPythonBlocklistListParams;
  options?: Omit<
    UseQueryOptions<
      PaginatedpythonPythonBlocklistEntryResponseList,
      DrfAxiosError
    >,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<PaginatedpythonPythonBlocklistEntryResponseList, DrfAxiosError>({
    ...options,
    queryKey: pythonRepositoryKeys.blocklistQuery(repositoryHref, params),
    queryFn:
      async (): Promise<PaginatedpythonPythonBlocklistEntryResponseList> =>
        (
          await axiosInstance.get<PaginatedpythonPythonBlocklistEntryResponseList>(
            `${toProxyHref(repositoryHref)}${BLOCKLIST_PATH}`,
            {
              params: {
                ...params,
                ordering: params.ordering ? [params.ordering] : undefined,
              },
            },
          )
        ).data,
  });

export const usePythonBlocklistQuery = ({
  repositoryHref,
  params,
}: {
  repositoryHref: string;
  params: IPythonBlocklistListParams;
}) =>
  useQuery({
    ...pythonBlocklistQueryOptions({ repositoryHref, params }),
    enabled: !!repositoryHref,
  });

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
        queryKey: pythonRepositoryKeys.blocklist(vars.repositoryHref),
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
        queryKey: pythonRepositoryKeys.blocklist(entry.repository ?? ""),
      });
      options?.onSuccess?.(data, entry);
    },
    onError: options?.onError,
  });
};
