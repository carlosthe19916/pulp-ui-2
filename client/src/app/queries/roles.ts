import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type {
  PaginatedRoleResponseList,
  PatchedRole,
  Role,
  RoleResponse,
} from "@app/client";
import {
  rolesCreate,
  rolesDelete,
  rolesList,
  rolesPartialUpdate,
  rolesRead,
} from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

export const RolesQueryKey = "roles";

type RoleOrdering = NonNullable<
  Parameters<typeof rolesList>[0]["query"]
>["ordering"];

interface RoleListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<RoleOrdering>[number];
  name__icontains?: string;
}

export const rolesRootQueryOptions = queryOptions({
  queryKey: [RolesQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const rolesListQueryOptions = (params: RoleListParams = {}) =>
  queryOptions({
    queryKey: [...rolesRootQueryOptions.queryKey, "list", params],
    queryFn: async (): Promise<PaginatedRoleResponseList> => {
      const response = await rolesList({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        query: {
          limit: params.limit ?? 20,
          offset: params.offset,
          ordering: params.ordering ? [params.ordering] : undefined,
          name__icontains: params.name__icontains,
        },
      });
      if (!response.data) {
        throw new Error("Empty roles list response");
      }
      return response.data;
    },
  });

export const roleDetailQueryOptions = (roleHref: string) =>
  queryOptions({
    queryKey: [...rolesRootQueryOptions.queryKey, "detail", roleHref],
    queryFn: async (): Promise<RoleResponse> => {
      const response = await rolesRead({
        client,
        path: { role_href: roleHref },
      });
      if (!response.data) {
        throw new Error("Empty role detail response");
      }
      return response.data;
    },
    enabled: !!roleHref,
  });

export const useRolesListQuery = (params: RoleListParams = {}) => {
  return useQuery(rolesListQueryOptions(params));
};

export const useRoleDetailQuery = (roleHref: string) => {
  return useQuery(roleDetailQueryOptions(roleHref));
};

export const useRoleCreateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Role) => {
      const response = await rolesCreate({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        body,
      });
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
      const response = await rolesPartialUpdate({
        client,
        path: { role_href: href },
        body,
      });
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
      const response = await rolesDelete({
        client,
        path: { role_href: roleHref },
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: rolesRootQueryOptions.queryKey,
      });
    },
  });
};
