import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type {
  PaginatedUserResponseList,
  PaginatedUserRoleResponseList,
  PatchedUser,
  UserResponse,
  UserRole,
  UserWritable,
} from "@app/client";
import {
  usersCreate,
  usersDelete,
  usersList,
  usersPartialUpdate,
  usersRead,
  usersRolesCreate,
  usersRolesDelete,
  usersRolesList,
} from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";
import { isEmptyDetailPayload } from "@app/utils/pulpHref";

export const UsersQueryKey = "users";

type UserOrdering = NonNullable<
  Parameters<typeof usersList>[0]["query"]
>["ordering"];

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

export const usersListQueryOptions = (params: UserListParams = {}) =>
  queryOptions({
    queryKey: [...usersRootQueryOptions.queryKey, "list", params],
    queryFn: async (): Promise<PaginatedUserResponseList> => {
      const response = await usersList({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        query: {
          limit: params.limit ?? 20,
          offset: params.offset,
          ordering: params.ordering ? [params.ordering] : undefined,
          username__icontains: params.username__icontains,
        },
      });
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
      const response = await usersRead({
        client,
        path: { auth_user_href: userHref },
      });
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
      const response = await usersRolesList({
        client,
        path: { auth_user_href: userHref },
      });
      if (!response.data) {
        throw new Error("Empty user roles list response");
      }
      return response.data;
    },
    enabled: !!userHref,
  });

export const useUsersListQuery = (params: UserListParams = {}) => {
  return useQuery(usersListQueryOptions(params));
};

export const useUserDetailQuery = (userHref: string) => {
  return useQuery(userDetailQueryOptions(userHref));
};

export const useUserRolesListQuery = (userHref: string) => {
  return useQuery(userRolesListQueryOptions(userHref));
};

export const useUserCreateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UserWritable) => {
      const response = await usersCreate({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        body,
      });
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
      const response = await usersPartialUpdate({
        client,
        path: { auth_user_href: href },
        body,
      });
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
      const response = await usersDelete({
        client,
        path: { auth_user_href: userHref },
      });
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
      const response = await usersRolesCreate({
        client,
        path: { auth_user_href: userHref },
        body,
      });
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
      const response = await usersRolesDelete({
        client,
        path: { auth_users_user_role_href: roleHref },
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: usersRootQueryOptions.queryKey,
      });
    },
  });
};
