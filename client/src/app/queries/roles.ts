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
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";
import { isEmptyDetailPayload } from "./utils/pulpHref";

export const RolesQueryKey = "roles";

type RoleOrdering = NonNullable<RolesListData["query"]>["ordering"];

interface IRoleListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<RoleOrdering>[number];
  name__icontains?: string;
}

export const rolesRootQueryOptions = queryOptions({
  queryKey: [RolesQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const rolesListQueryOptions = (
  domain: IPulpDomain,
  params: IRoleListParams = {},
) =>
  queryOptions({
    queryKey: [...rolesRootQueryOptions.queryKey, "list", domain, params],
    queryFn: async (): Promise<PaginatedRoleResponseList> => {
      const response = await axiosInstance.get<PaginatedRoleResponseList>(
        pulpApiPath("roles/", domain),
        {
          params: {
            limit: params.limit ?? 20,
            offset: params.offset,
            ordering: params.ordering ? [params.ordering] : undefined,
            name__icontains: params.name__icontains,
          },
        },
      );
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

export const useRolesListQuery = (params: IRoleListParams = {}) => {
  const domain = useApiDomain();
  return useQuery(rolesListQueryOptions(domain, params));
};

export const useRoleDetailQuery = (roleHref: string) => {
  return useQuery(roleDetailQueryOptions(roleHref));
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
