import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedUserResponseList,
  PaginatedUserRoleResponseList,
  PatchedUser,
  UserResponse,
  UserRole,
  UserRoleResponse,
  UsersListData,
  UserWritable,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { PulpDomain } from "./utils/pulpApi";
import { isEmptyDetailPayload } from "./utils/pulpHref";

export const UsersQueryKey = "users";

type UserOrdering = NonNullable<UsersListData["query"]>["ordering"];

interface UserListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<UserOrdering>[number];
  username__icontains?: string;
}

export const usersRootQueryOptions = queryOptions({
  queryKey: [UsersQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const usersListQueryOptions = (
  domain: PulpDomain,
  params: UserListParams = {},
) =>
  queryOptions({
    queryKey: [...usersRootQueryOptions.queryKey, "list", domain, params],
    queryFn: async (): Promise<PaginatedUserResponseList> => {
      const response = await axiosInstance.get<PaginatedUserResponseList>(
        pulpApiPath("users/", domain),
        {
          params: {
            limit: params.limit ?? 20,
            offset: params.offset,
            ordering: params.ordering ? [params.ordering] : undefined,
            username__icontains: params.username__icontains,
          },
        },
      );
      if (!response.data) {
        throw new Error("Empty users list response");
      }
      return response.data;
    },
  });

export const userDetailQueryOptions = (userHref: string) =>
  queryOptions({
    queryKey: [...usersRootQueryOptions.queryKey, "detail", userHref],
    queryFn: async (): Promise<UserResponse> => {
      const response = await axiosInstance.get<UserResponse>(
        toProxyHref(userHref),
      );
      if (isEmptyDetailPayload(response.data) || !response.data.username) {
        throw new Error("Empty user detail response");
      }
      return response.data;
    },
    enabled: !!userHref,
  });

export const userRolesListQueryOptions = (userHref: string) =>
  queryOptions({
    queryKey: [...usersRootQueryOptions.queryKey, "roles", userHref],
    queryFn: async (): Promise<PaginatedUserRoleResponseList> => {
      const response = await axiosInstance.get<PaginatedUserRoleResponseList>(
        `${toProxyHref(userHref)}roles/`,
      );
      if (!response.data) {
        throw new Error("Empty user roles list response");
      }
      return response.data;
    },
    enabled: !!userHref,
  });

export const useUsersListQuery = (params: UserListParams = {}) => {
  const domain = useApiDomain();
  return useQuery(usersListQueryOptions(domain, params));
};

export const useUserDetailQuery = (userHref: string) => {
  return useQuery(userDetailQueryOptions(userHref));
};

export const useUserRolesListQuery = (userHref: string) => {
  return useQuery(userRolesListQueryOptions(userHref));
};

export const useUserCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async (body: UserWritable) => {
      const response = await axiosInstance.post<UserResponse>(
        pulpApiPath("users/", domain),
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: usersRootQueryOptions.queryKey,
      });
    },
  });
};

export const useUserUpdateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ href, body }: { href: string; body: PatchedUser }) => {
      const response = await axiosInstance.patch<UserResponse>(
        toProxyHref(href),
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: usersRootQueryOptions.queryKey,
      });
    },
  });
};

export const useUserDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userHref: string) => {
      const response = await axiosInstance.delete<void>(toProxyHref(userHref));
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: usersRootQueryOptions.queryKey,
      });
    },
  });
};

export const useUserRoleCreateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userHref,
      body,
    }: {
      userHref: string;
      body: UserRole;
    }) => {
      const response = await axiosInstance.post<UserRoleResponse>(
        `${toProxyHref(userHref)}roles/`,
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: usersRootQueryOptions.queryKey,
      });
    },
  });
};

export const useUserRoleDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleHref: string) => {
      const response = await axiosInstance.delete<void>(toProxyHref(roleHref));
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: usersRootQueryOptions.queryKey,
      });
    },
  });
};
