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
  UsersRolesListData,
  UserWritable,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { fetchAllPages } from "./utils/fetchAllPages";
import type { AllListParams, ListParams } from "./utils/listParams";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";
import { buildUserHref, isEmptyDetailPayload } from "./utils/pulpHref";

export const UsersQueryKey = "users";

export type IUserListParams = ListParams<UsersListData>;

export type IUserRoleListParams = ListParams<UsersRolesListData>;

export type IAllUserRoleListParams = AllListParams<UsersRolesListData>;

export const usersRootQueryOptions = queryOptions({
  queryKey: [UsersQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const usersListQueryOptions = (
  domain: IPulpDomain,
  params: IUserListParams,
) =>
  queryOptions({
    queryKey: [...usersRootQueryOptions.queryKey, "list", domain, params],
    queryFn: async (): Promise<PaginatedUserResponseList> => {
      const response = await axiosInstance.get<PaginatedUserResponseList>(
        pulpApiPath("users/", domain),
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

export const userRolesListQueryOptions = (
  userHref: string,
  params: IUserRoleListParams,
) =>
  queryOptions({
    queryKey: [...usersRootQueryOptions.queryKey, "roles", userHref, params],
    queryFn: async (): Promise<PaginatedUserRoleResponseList> => {
      const response = await axiosInstance.get<PaginatedUserRoleResponseList>(
        `${toProxyHref(userHref)}roles/`,
        {
          params: {
            ...params,
            ordering: params.ordering ? [params.ordering] : undefined,
          },
        },
      );
      return response.data;
    },
    enabled: !!userHref,
  });

/** The dual-list role editor needs every assignment at once, so page through the whole list. */
export const allUserRolesListQueryOptions = (
  userHref: string,
  params: IAllUserRoleListParams = {},
) =>
  queryOptions({
    queryKey: [
      ...usersRootQueryOptions.queryKey,
      "roles",
      "all",
      userHref,
      params,
    ],
    queryFn: async (): Promise<PaginatedUserRoleResponseList> => {
      const { results, count } = await fetchAllPages<UserRoleResponse>(
        async (offset, limit) => {
          const response =
            await axiosInstance.get<PaginatedUserRoleResponseList>(
              `${toProxyHref(userHref)}roles/`,
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
    enabled: !!userHref,
  });

export const useUsersListQuery = (params: IUserListParams) => {
  const domain = useApiDomain();
  return useQuery(usersListQueryOptions(domain, params));
};

export const useUserDetailQuery = (userId: string) => {
  const domain = useApiDomain();
  return useQuery(userDetailQueryOptions(buildUserHref(userId, domain)));
};

export const useUserRolesListQuery = (
  userId: string,
  params: IUserRoleListParams,
) => {
  const domain = useApiDomain();
  return useQuery(
    userRolesListQueryOptions(buildUserHref(userId, domain), params),
  );
};

export const useAllUserRolesListQuery = (
  userId: string,
  params: IAllUserRoleListParams = {},
) => {
  const domain = useApiDomain();
  return useQuery(
    allUserRolesListQueryOptions(buildUserHref(userId, domain), params),
  );
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
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async ({
      userId,
      body,
    }: {
      userId: string;
      body: PatchedUser;
    }) => {
      const response = await axiosInstance.patch<UserResponse>(
        toProxyHref(buildUserHref(userId, domain)),
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
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await axiosInstance.delete<void>(
        toProxyHref(buildUserHref(userId, domain)),
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

export const useUserRoleCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async ({
      userId,
      body,
    }: {
      userId: string;
      body: UserRole;
    }) => {
      const response = await axiosInstance.post<UserRoleResponse>(
        `${toProxyHref(buildUserHref(userId, domain))}roles/`,
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
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async ({
      userId,
      assignmentId,
    }: {
      userId: string;
      assignmentId: string;
    }) => {
      const response = await axiosInstance.delete<void>(
        pulpApiPath(`users/${userId}/roles/${assignmentId}/`, domain),
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

interface IUserRolesSyncArgs {
  userId: string;
  /** Role names to assign. */
  toAdd: string[];
  /** Assignment IDs to unassign. */
  toRemove: string[];
}

/** Batches role assigns/unassigns for one user and invalidates once. */
export const useUserRolesSyncMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async ({ userId, toAdd, toRemove }: IUserRolesSyncArgs) => {
      await Promise.all([
        ...toAdd.map((role) =>
          axiosInstance.post<UserRoleResponse>(
            `${toProxyHref(buildUserHref(userId, domain))}roles/`,
            {
              role,
              content_object: null,
            },
          ),
        ),
        ...toRemove.map((assignmentId) =>
          axiosInstance.delete<void>(
            pulpApiPath(`users/${userId}/roles/${assignmentId}/`, domain),
          ),
        ),
      ]);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: usersRootQueryOptions.queryKey,
      });
    },
  });
};
