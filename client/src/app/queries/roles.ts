import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
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
import { buildRoleHref } from "./utils/pulpHref";

export const RolesQueryKey = "roles";

export type IRoleListParams = ListParams<RolesListData>;

export type IAllRoleListParams = AllListParams<RolesListData>;

export const rolesRootQueryOptions = queryOptions({
  queryKey: [RolesQueryKey],
  queryFn: async (): Promise<null> => null,
});

/**
 * Query-key factory mirroring the REST paths. Identifying segments precede the
 * `"all"` fetch variant and params, so a prefix invalidates all variants of a
 * collection. Shared by the query options and mutations to prevent key drift.
 */
export const roleKeys = {
  // --- invalidation folders (prefixes for invalidateQueries) ---
  // ["roles"]
  all: () => [RolesQueryKey] as const,
  // ["roles", "list"] — every list query (paginated + all), any domain/params
  list: () => [...roleKeys.all(), "list"] as const,
  // ["roles", "detail", roleHref] — one role
  detail: (roleHref: string) =>
    [...roleKeys.all(), "detail", roleHref] as const,

  // --- real query keys (for useQuery / queryOptions) ---
  // ["roles", "list", domain, params]
  listQuery: (domain: IPulpDomain, params: IRoleListParams) =>
    [...roleKeys.list(), domain, params] as const,
  // ["roles", "list", domain, "all", params]
  listAllQuery: (domain: IPulpDomain, params: IAllRoleListParams) =>
    [...roleKeys.list(), domain, "all", params] as const,
};

export const rolesListQueryOptions = (
  domain: IPulpDomain,
  params: IRoleListParams,
) =>
  queryOptions({
    queryKey: roleKeys.listQuery(domain, params),
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

/** Fetch every role at once (e.g. dual-list picker). Prefer server-side paging for single pages. */
export const allRolesListQueryOptions = (
  domain: IPulpDomain,
  params: IAllRoleListParams = {},
) =>
  queryOptions({
    queryKey: roleKeys.listAllQuery(domain, params),
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

export const useRolesListQuery = (params: IRoleListParams) => {
  const domain = useApiDomain();
  return useQuery(rolesListQueryOptions(domain, params));
};

export const useAllRolesListQuery = (params: IAllRoleListParams = {}) => {
  const domain = useApiDomain();
  return useQuery(allRolesListQueryOptions(domain, params));
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
      void queryClient.invalidateQueries({ queryKey: roleKeys.list() });
    },
  });
};

export const useRoleUpdateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async ({
      roleId,
      body,
    }: {
      roleId: string;
      body: PatchedRole;
    }) => {
      const response = await axiosInstance.patch<RoleResponse>(
        toProxyHref(buildRoleHref(roleId, domain)),
        body,
      );
      return response.data;
    },
    onSuccess: (_data, { roleId }) => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: roleKeys.detail(buildRoleHref(roleId, domain)),
      });
    },
  });
};

export const useRoleDeleteMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async (roleId: string) => {
      const response = await axiosInstance.delete<void>(
        toProxyHref(buildRoleHref(roleId, domain)),
      );
      return response.data;
    },
    onSuccess: (_data, roleId) => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: roleKeys.detail(buildRoleHref(roleId, domain)),
      });
    },
  });
};
