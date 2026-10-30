import type { UseQueryOptions } from "@tanstack/react-query";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  Domain,
  DomainBackendMigrator,
  DomainResponse,
  DomainsListData,
  PaginatedDomainResponseList,
  PatchedDomain,
} from "@app/client";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";

import { applyLabelChanges, type ILabelsChangeVariables } from "./labels";
import { taskKeys } from "./tasks";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IBatchResult } from "./utils/settleBatch";

export const DomainsQueryKey = "domains";

export type IDomainListParams = ListParams<DomainsListData>;

/**
 * Query-key factory mirroring the REST paths (a prefix invalidates all variants).
 * `apiDomain` is the deployment domain, not the Domains resource listed here.
 */
export const domainKeys = {
  all: () => [DomainsQueryKey] as const,
  list: () => [...domainKeys.all(), "list"] as const,
  detail: (domainHref: string) =>
    [...domainKeys.all(), "detail", domainHref] as const,

  listQuery: (apiDomain: IPulpDomain, params: IDomainListParams) =>
    [...domainKeys.list(), apiDomain, params] as const,
  detailQuery: (domainHref: string) => domainKeys.detail(domainHref),
};

type DomainListOptions = Omit<
  UseQueryOptions<PaginatedDomainResponseList, DrfAxiosError>,
  "queryKey" | "queryFn"
>;

/** `domain` is the deployment domain the request runs in, not a listed Domain. */
export const domainsListQueryOptions = ({
  domain,
  params,
  options,
}: {
  domain: IPulpDomain;
  params: IDomainListParams;
  options?: DomainListOptions;
}) =>
  queryOptions<PaginatedDomainResponseList, DrfAxiosError>({
    ...options,
    queryKey: domainKeys.listQuery(domain, params),
    queryFn: async (): Promise<PaginatedDomainResponseList> => {
      const response = await axiosInstance.get<PaginatedDomainResponseList>(
        pulpApiPath("domains/", domain),
        {
          params: {
            ...params,
            ordering: params.ordering ? [params.ordering] : undefined,
          },
        },
      );
      return response.data;
    },
  });

export const useDomainsListQuery = ({
  params,
  options,
}: {
  params: IDomainListParams;
  options?: DomainListOptions;
}) => {
  const domain = useDefaultDomain();
  return useQuery(domainsListQueryOptions({ domain, params, options }));
};

export const useDomainCreateMutation = (
  options?: IMutationCallbacks<DomainResponse, Domain>,
) => {
  const queryClient = useQueryClient();
  const apiDomain = useDefaultDomain();
  return useMutation<DomainResponse, DrfAxiosError, Domain>({
    mutationFn: async (body: Domain) => {
      const response = await axiosInstance.post<DomainResponse>(
        pulpApiPath("domains/", apiDomain),
        body,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: domainKeys.list() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useDomainUpdateMutation = (
  options?: IMutationCallbacks<
    DomainResponse | AsyncOperationResponse,
    { href: string; body: PatchedDomain }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    DomainResponse | AsyncOperationResponse,
    DrfAxiosError,
    { href: string; body: PatchedDomain }
  >({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      body: PatchedDomain;
    }) => {
      const response = await axiosInstance.patch<
        DomainResponse | AsyncOperationResponse
      >(toProxyHref(href), body);
      return response.data;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: domainKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: domainKeys.detail(variables.href),
      });
      // Surface the new update task on the row without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useDomainDeleteMutation = (
  options?: IMutationCallbacks<AsyncOperationResponse, DomainResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation<AsyncOperationResponse, DrfAxiosError, DomainResponse>({
    mutationFn: async (domain: DomainResponse) => {
      const response = await axiosInstance.delete<AsyncOperationResponse>(
        toProxyHref(domain.pulp_href ?? ""),
      );
      return response.data;
    },
    onSuccess: (data, domain) => {
      void queryClient.invalidateQueries({ queryKey: domainKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: domainKeys.detail(domain.pulp_href ?? ""),
      });
      // Surface the new delete task on the row without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, domain);
    },
    onError: options?.onError,
  });
};

export interface IDomainMigrateVariables {
  /** The domain whose artifacts move to the new storage. */
  domainName: string;
  body: DomainBackendMigrator;
}

/**
 * Moves a domain's artifacts to a new storage backend, then switches the domain
 * to it (the old files stay). Runs in that domain's URL; starts a task.
 */
export const useDomainMigrateMutation = (
  options?: IMutationCallbacks<AsyncOperationResponse, IDomainMigrateVariables>,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    IDomainMigrateVariables
  >({
    mutationFn: async ({ domainName, body }) =>
      (
        await axiosInstance.post<AsyncOperationResponse>(
          pulpApiPath("domains/migrate/", { enabled: true, name: domainName }),
          body,
        )
      ).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: domainKeys.list() });
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

/** Saves a diff of a domain's labels; refreshes the domain list (domains have no detail page). */
export const useDomainLabelsMutation = (
  options?: IMutationCallbacks<IBatchResult, ILabelsChangeVariables>,
) => {
  const queryClient = useQueryClient();
  return useMutation<IBatchResult, DrfAxiosError, ILabelsChangeVariables>({
    mutationFn: applyLabelChanges,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: domainKeys.list() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};
