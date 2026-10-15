import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

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
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";
import { taskKeys } from "./tasks";
import { buildDomainHref } from "./utils/pulpHref";

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

export const domainDetailQueryOptions = ({
  domainHref,
  options,
}: {
  domainHref: string;
  options?: Omit<UseQueryOptions<DomainResponse>, "queryKey" | "queryFn">;
}) =>
  queryOptions({
    ...options,
    queryKey: domainKeys.detailQuery(domainHref),
    queryFn: async (): Promise<DomainResponse> => {
      const response = await axiosInstance.get<DomainResponse>(
        toProxyHref(domainHref),
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

export const useDomainDetailQuery = ({ domainId }: { domainId: string }) => {
  const apiDomain = useDefaultDomain();
  const domainHref = buildDomainHref(domainId, apiDomain);
  return useQuery({
    ...domainDetailQueryOptions({ domainHref }),
    enabled: !!domainHref,
  });
};

export const useDomainCreateMutation = () => {
  const queryClient = useQueryClient();
  const apiDomain = useDefaultDomain();
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
  const apiDomain = useDefaultDomain();
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
      // Surface the new update task on the row without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
    },
  });
};

export const useDomainDeleteMutation = () => {
  const queryClient = useQueryClient();
  const apiDomain = useDefaultDomain();
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
      // Surface the new delete task on the row without waiting for the next poll.
      void queryClient.invalidateQueries({ queryKey: taskKeys.byPrn() });
    },
  });
};
