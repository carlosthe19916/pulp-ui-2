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
  DomainResponse,
  DomainsListData,
  PaginatedDomainResponseList,
  PatchedDomain,
} from "@app/client";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";
import { taskKeys } from "./tasks";

export const DomainsQueryKey = "domains";

export type IDomainListParams = ListParams<DomainsListData>;

/**
 * Query-key factory mirroring the REST paths; identifying segments precede params
 * so a prefix invalidates all variants. `apiDomain` is the pulp *deployment*
 * domain (`IPulpDomain`) — not the Domains *resource* this module lists.
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

export const domainsListQueryOptions = ({
  apiDomain,
  params,
}: {
  apiDomain: IPulpDomain;
  params: IDomainListParams;
}) =>
  queryOptions<PaginatedDomainResponseList, DrfAxiosError>({
    queryKey: domainKeys.listQuery(apiDomain, params),
    queryFn: async (): Promise<PaginatedDomainResponseList> => {
      const response = await axiosInstance.get<PaginatedDomainResponseList>(
        pulpApiPath("domains/", apiDomain),
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
}: {
  params: IDomainListParams;
}) => {
  const apiDomain = useDefaultDomain();
  return useQuery(domainsListQueryOptions({ apiDomain, params }));
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
