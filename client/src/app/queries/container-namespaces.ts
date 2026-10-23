import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  ContainerContainerNamespace,
  ContainerContainerNamespaceResponse,
  PaginatedcontainerContainerNamespaceResponseList,
  PulpContainerNamespacesListData,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { taskKeys } from "./tasks";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const ContainerNamespacesQueryKey = "container-namespaces";

export type IContainerNamespaceListParams =
  ListParams<PulpContainerNamespacesListData>;

export const containerNamespaceKeys = {
  all: () => [ContainerNamespacesQueryKey] as const,
  list: () => [...containerNamespaceKeys.all(), "list"] as const,
  listQuery: (domain: IPulpDomain, params: IContainerNamespaceListParams) =>
    [...containerNamespaceKeys.list(), domain, params] as const,
};

export const containerNamespacesListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IContainerNamespaceListParams;
}) =>
  queryOptions<PaginatedcontainerContainerNamespaceResponseList, DrfAxiosError>(
    {
      queryKey: containerNamespaceKeys.listQuery(domain, params),
      queryFn: async () =>
        (
          await axiosInstance.get<PaginatedcontainerContainerNamespaceResponseList>(
            pulpApiPath("pulp_container/namespaces/", domain),
            {
              params: {
                ...params,
                ordering: params.ordering ? [params.ordering] : undefined,
              },
            },
          )
        ).data,
    },
  );

export const useContainerNamespacesListQuery = ({
  params,
}: {
  params: IContainerNamespaceListParams;
}) => {
  const domain = useSelectedDomain();
  return useQuery(containerNamespacesListQueryOptions({ domain, params }));
};

export const useContainerNamespaceCreateMutation = (
  options?: IMutationCallbacks<
    ContainerContainerNamespaceResponse,
    ContainerContainerNamespace
  >,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    ContainerContainerNamespaceResponse,
    DrfAxiosError,
    ContainerContainerNamespace
  >({
    mutationFn: async (body) =>
      (
        await axiosInstance.post<ContainerContainerNamespaceResponse>(
          pulpApiPath("pulp_container/namespaces/", domain),
          body,
        )
      ).data,
    onSuccess: (data, body) => {
      void queryClient.invalidateQueries({
        queryKey: containerNamespaceKeys.list(),
      });
      options?.onSuccess?.(data, body);
    },
    onError: options?.onError,
  });
};

/** Deletes a namespace and its repositories; returns the task. */
export const useContainerNamespaceDeleteMutation = (
  options?: IMutationCallbacks<
    AsyncOperationResponse,
    ContainerContainerNamespaceResponse
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    ContainerContainerNamespaceResponse
  >({
    mutationFn: async (namespace) =>
      (
        await axiosInstance.delete<AsyncOperationResponse>(
          toProxyHref(namespace.pulp_href ?? ""),
        )
      ).data,
    onSuccess: (data, namespace) => {
      void queryClient.invalidateQueries({
        queryKey: containerNamespaceKeys.list(),
      });
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, namespace);
    },
    onError: options?.onError,
  });
};
