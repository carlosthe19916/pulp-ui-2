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
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";
import { fetchAllPages } from "./utils/fetchAllPages";
import type { AllListParams, ListParams } from "./utils/listParams";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const RolesQueryKey = "roles";

export type IRoleListParams = ListParams<RolesListData>;

export type IAllRoleListParams = AllListParams<RolesListData>;

/**
 * Query-key factory mirroring the REST paths. Identifying segments precede the
 * `"all"` fetch variant and params, so a prefix invalidates all variants of a
 * collection. Shared by the query options and mutations to prevent key drift.
 */
export const roleKeys = {
  all: () => [RolesQueryKey] as const,
  list: () => [...roleKeys.all(), "list"] as const,
  detail: (roleHref: string) =>
    [...roleKeys.all(), "detail", roleHref] as const,

  listQuery: (domain: IPulpDomain, params: IRoleListParams) =>
    [...roleKeys.list(), domain, params] as const,
  listAllQuery: (domain: IPulpDomain, params: IAllRoleListParams) =>
    [...roleKeys.list(), domain, "all", params] as const,
};

export const rolesListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IRoleListParams;
}) =>
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
export const allRolesListQueryOptions = ({
  domain,
  params = {},
}: {
  domain: IPulpDomain;
  params?: IAllRoleListParams;
}) =>
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

export const useRolesListQuery = ({ params }: { params: IRoleListParams }) => {
  const domain = useDefaultDomain();
  return useQuery(rolesListQueryOptions({ domain, params }));
};

export const useAllRolesListQuery = ({
  params = {},
}: {
  params?: IAllRoleListParams;
} = {}) => {
  const domain = useDefaultDomain();
  return useQuery(allRolesListQueryOptions({ domain, params }));
};

export const useRoleCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useDefaultDomain();
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
  return useMutation({
    mutationFn: async ({ href, body }: { href: string; body: PatchedRole }) => {
      const response = await axiosInstance.patch<RoleResponse>(
        toProxyHref(href),
        body,
      );
      return response.data;
    },
    onSuccess: (_data, { href }) => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: roleKeys.detail(toProxyHref(href)),
      });
    },
  });
};

export const useRoleDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (href: string) => {
      const response = await axiosInstance.delete<void>(toProxyHref(href));
      return response.data;
    },
    onSuccess: (_data, href) => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: roleKeys.detail(toProxyHref(href)),
      });
    },
  });
};
