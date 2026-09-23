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
import { useApiDomain } from "@app/hooks/useApiDomain";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";
import { buildDomainHref } from "./utils/pulpHref";

export const DomainsQueryKey = "domains";

export type IDomainListParams = ListParams<DomainsListData>;

export const domainsRootQueryOptions = queryOptions({
  queryKey: [DomainsQueryKey],
  queryFn: async (): Promise<null> => null,
});

/**
 * Query-key factory mirroring the REST paths. `apiDomain` below is the pulp
 * *deployment* domain (`IPulpDomain`, the slug that scopes every API path) — not
 * to be confused with the Domains *resource* this module lists. Identifying
 * segments precede params so a prefix invalidates all variants of a collection.
 */
export const domainKeys = {
  // --- invalidation folders (prefixes for invalidateQueries) ---
  // ["domains"]
  all: () => [DomainsQueryKey] as const,
  // ["domains", "list"] — every list query, any apiDomain/params
  list: () => [...domainKeys.all(), "list"] as const,
  // ["domains", "detail", domainHref]
  detail: (domainHref: string) =>
    [...domainKeys.all(), "detail", domainHref] as const,

  // --- real query keys (for useQuery / queryOptions) ---
  // ["domains", "list", apiDomain, params]
  listQuery: (apiDomain: IPulpDomain, params: IDomainListParams) =>
    [...domainKeys.list(), apiDomain, params] as const,
  // ["domains", "detail", domainHref] — same value as detail() (no params)
  detailQuery: (domainHref: string) => domainKeys.detail(domainHref),
};

export const domainsListQueryOptions = (
  apiDomain: IPulpDomain,
  params: IDomainListParams,
) =>
  queryOptions({
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

export const domainDetailQueryOptions = (domainHref: string) =>
  queryOptions({
    queryKey: domainKeys.detailQuery(domainHref),
    queryFn: async (): Promise<DomainResponse> => {
      const response = await axiosInstance.get<DomainResponse>(
        toProxyHref(domainHref),
      );
      return response.data;
    },
    enabled: !!domainHref,
  });

export const useDomainsListQuery = (params: IDomainListParams) => {
  const apiDomain = useApiDomain();
  return useQuery(domainsListQueryOptions(apiDomain, params));
};

export const useDomainDetailQuery = (domainId: string) => {
  const apiDomain = useApiDomain();
  return useQuery(
    domainDetailQueryOptions(buildDomainHref(domainId, apiDomain)),
  );
};

export const useDomainCreateMutation = () => {
  const queryClient = useQueryClient();
  const apiDomain = useApiDomain();
  return useMutation({
    mutationFn: async (body: Domain) => {
      const response = await axiosInstance.post<DomainResponse>(
        pulpApiPath("domains/", apiDomain),
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: domainKeys.list() });
    },
  });
};

export const useDomainUpdateMutation = () => {
  const queryClient = useQueryClient();
  const apiDomain = useApiDomain();
  return useMutation({
    mutationFn: async ({
      domainId,
      body,
    }: {
      domainId: string;
      body: PatchedDomain;
    }) => {
      const response = await axiosInstance.patch<
        DomainResponse | AsyncOperationResponse
      >(toProxyHref(buildDomainHref(domainId, apiDomain)), body);
      return response.data;
    },
    onSuccess: (_data, { domainId }) => {
      void queryClient.invalidateQueries({ queryKey: domainKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: domainKeys.detail(buildDomainHref(domainId, apiDomain)),
      });
    },
  });
};

export const useDomainDeleteMutation = () => {
  const queryClient = useQueryClient();
  const apiDomain = useApiDomain();
  return useMutation({
    mutationFn: async (domainId: string) => {
      const response = await axiosInstance.delete<AsyncOperationResponse>(
        toProxyHref(buildDomainHref(domainId, apiDomain)),
      );
      return response.data;
    },
    onSuccess: (_data, domainId) => {
      void queryClient.invalidateQueries({ queryKey: domainKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: domainKeys.detail(buildDomainHref(domainId, apiDomain)),
      });
    },
  });
};
