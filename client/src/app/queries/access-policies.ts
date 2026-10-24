import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AccessPoliciesListData,
  AccessPolicyResponse,
  PaginatedAccessPolicyResponseList,
} from "@app/client";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";

import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";

export const AccessPoliciesQueryKey = "access-policies";

export type IAccessPolicyListParams = ListParams<AccessPoliciesListData>;

export const accessPolicyKeys = {
  all: () => [AccessPoliciesQueryKey] as const,
  list: () => [...accessPolicyKeys.all(), "list"] as const,
  listQuery: (domain: IPulpDomain, params: IAccessPolicyListParams) =>
    [...accessPolicyKeys.list(), domain, params] as const,
};

export const accessPoliciesListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IAccessPolicyListParams;
}) =>
  queryOptions<PaginatedAccessPolicyResponseList, DrfAxiosError>({
    queryKey: accessPolicyKeys.listQuery(domain, params),
    queryFn: async () =>
      (
        await axiosInstance.get<PaginatedAccessPolicyResponseList>(
          pulpApiPath("access_policies/", domain),
          {
            params: {
              ...params,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        )
      ).data,
  });

/** Access policies are instance-wide; listed through the default domain. */
export const useAccessPoliciesListQuery = ({
  params,
}: {
  params: IAccessPolicyListParams;
}) => {
  const domain = useDefaultDomain();
  return useQuery(accessPoliciesListQueryOptions({ domain, params }));
};

export const useAccessPolicyUpdateMutation = (
  options?: IMutationCallbacks<
    AccessPolicyResponse,
    { href: string; body: Record<string, unknown> }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    AccessPolicyResponse,
    DrfAxiosError,
    { href: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({ href, body }) =>
      (await axiosInstance.patch<AccessPolicyResponse>(toProxyHref(href), body))
        .data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: accessPolicyKeys.list() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

/** Restores a customized policy to the plugin's default. */
export const useAccessPolicyResetMutation = (
  options?: IMutationCallbacks<AccessPolicyResponse, AccessPolicyResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation<AccessPolicyResponse, DrfAxiosError, AccessPolicyResponse>(
    {
      mutationFn: async (policy) =>
        (
          await axiosInstance.post<AccessPolicyResponse>(
            `${toProxyHref(policy.pulp_href ?? "")}reset/`,
          )
        ).data,
      onSuccess: (data, policy) => {
        void queryClient.invalidateQueries({
          queryKey: accessPolicyKeys.list(),
        });
        options?.onSuccess?.(data, policy);
      },
      onError: options?.onError,
    },
  );
};
