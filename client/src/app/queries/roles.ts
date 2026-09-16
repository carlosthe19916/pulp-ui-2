import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedRoleResponseList,
  PatchedRole,
  Role,
  RoleResponse,
  RolesListData,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { fetchAllPages } from "./utils/fetchAllPages";
import type { AllListParams, ListParams } from "./utils/listParams";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";
import { buildRoleHref, isEmptyDetailPayload } from "./utils/pulpHref";

export const RolesQueryKey = "roles";

export type IRoleListParams = ListParams<RolesListData>;

export type IAllRoleListParams = AllListParams<RolesListData>;

export const rolesRootQueryOptions = queryOptions({
  queryKey: [RolesQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const rolesListQueryOptions = (
  domain: IPulpDomain,
  params: IRoleListParams,
) =>
  queryOptions({
    queryKey: [...rolesRootQueryOptions.queryKey, "list", domain, params],
    queryFn: async (): Promise<PaginatedRoleResponseList> => {
      const response = await axiosInstance.get<PaginatedRoleResponseList>(
        pulpApiPath("roles/", domain),
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

/**
 * Fetch-all fallback for callers that need every role at once (e.g. a
 * client-side dual-list role picker, or harvesting the union of all permission
 * strings). Prefer server-side pagination/filtering for anything that renders a
 * single page.
 */
export const allRolesListQueryOptions = (
  domain: IPulpDomain,
  params: IAllRoleListParams = {},
) =>
  queryOptions({
    queryKey: [
      ...rolesRootQueryOptions.queryKey,
      "list",
      "all",
      domain,
      params,
    ],
    queryFn: async (): Promise<PaginatedRoleResponseList> => {
      const { results, count } = await fetchAllPages<RoleResponse>(
        async (offset, limit) => {
          const response = await axiosInstance.get<PaginatedRoleResponseList>(
            pulpApiPath("roles/", domain),
            {
              params: {
                ...params,
                offset,
                limit,
                ordering: params.ordering ? [params.ordering] : undefined,
              },
            },
          );
          return response.data;
        },
      );
      return { count, next: null, previous: null, results };
    },
  });

export const roleDetailQueryOptions = (roleHref: string) =>
  queryOptions({
    queryKey: [...rolesRootQueryOptions.queryKey, "detail", roleHref],
    queryFn: async (): Promise<RoleResponse> => {
      const response = await axiosInstance.get<RoleResponse>(
        toProxyHref(roleHref),
      );
      if (isEmptyDetailPayload(response.data) || !response.data.name) {
        throw new Error("Empty role detail response");
      }
      return response.data;
    },
    enabled: !!roleHref,
  });

export const useRolesListQuery = (params: IRoleListParams) => {
  const domain = useApiDomain();
  return useQuery(rolesListQueryOptions(domain, params));
};

export const useAllRolesListQuery = (params: IAllRoleListParams = {}) => {
  const domain = useApiDomain();
  return useQuery(allRolesListQueryOptions(domain, params));
};

export const useRoleDetailQuery = (roleId: string) => {
  const domain = useApiDomain();
  return useQuery(roleDetailQueryOptions(buildRoleHref(roleId, domain)));
};

export const useSuspenseRoleDetailQuery = (roleId: string) => {
  const domain = useApiDomain();
  return useSuspenseQuery(
    roleDetailQueryOptions(buildRoleHref(roleId, domain)),
  );
};

export const useRoleCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async (body: Role) => {
      const response = await axiosInstance.post<RoleResponse>(
        pulpApiPath("roles/", domain),
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: rolesRootQueryOptions.queryKey,
      });
    },
  });
};

export const useRoleUpdateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ href, body }: { href: string; body: PatchedRole }) => {
      const response = await axiosInstance.patch<RoleResponse>(
        toProxyHref(href),
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: rolesRootQueryOptions.queryKey,
      });
    },
  });
};

export const useRoleDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleHref: string) => {
      const response = await axiosInstance.delete<void>(toProxyHref(roleHref));
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: rolesRootQueryOptions.queryKey,
      });
    },
  });
};
