import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedUserResponseList,
  PatchedUser,
  UserResponse,
  UsersListData,
  UsersRolesListData,
  UserWritable,
} from "@app/client";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";

import { groupKeys } from "./groups";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";

export const UsersQueryKey = "users";

export type IUserListParams = ListParams<UsersListData>;

export type IUserRoleListParams = ListParams<UsersRolesListData>;

/**
 * Query-key factory mirroring the REST paths; identifying segments precede params so a
 * prefix invalidates all variants.
 */
export const userKeys = {
  all: () => [UsersQueryKey] as const,
  list: () => [...userKeys.all(), "list"] as const,
  details: () => [...userKeys.all(), "detail"] as const,
  detail: (userHref: string) => [...userKeys.details(), userHref] as const,
  roles: (userHref: string) => [...userKeys.detail(userHref), "roles"] as const,

  listQuery: (domain: IPulpDomain, params: IUserListParams) =>
    [...userKeys.list(), domain, params] as const,
  detailQuery: (userHref: string) => userKeys.detail(userHref),
  rolesQuery: (userHref: string, params: IUserRoleListParams) =>
    [...userKeys.roles(userHref), params] as const,
};

export const usersListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IUserListParams;
}) =>
  queryOptions<PaginatedUserResponseList, DrfAxiosError>({
    queryKey: userKeys.listQuery(domain, params),
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

export const userDetailQueryOptions = ({ userHref }: { userHref: string }) =>
  queryOptions<UserResponse, DrfAxiosError>({
    queryKey: userKeys.detailQuery(userHref),
    queryFn: async (): Promise<UserResponse> => {
      const response = await axiosInstance.get<UserResponse>(
        toProxyHref(userHref),
      );
      return response.data;
    },
  });

export const useUsersListQuery = ({ params }: { params: IUserListParams }) => {
  const domain = useDefaultDomain();
  return useQuery(usersListQueryOptions({ domain, params }));
};

export const useSuspenseUserDetailQuery = ({
  userHref,
}: {
  userHref: string;
}) => useSuspenseQuery(userDetailQueryOptions({ userHref }));

export const useUserCreateMutation = (
  options?: IMutationCallbacks<UserResponse, UserWritable>,
) => {
  const queryClient = useQueryClient();
  const domain = useDefaultDomain();
  return useMutation<UserResponse, DrfAxiosError, UserWritable>({
    mutationFn: async (body: UserWritable) => {
      const response = await axiosInstance.post<UserResponse>(
        pulpApiPath("users/", domain),
        body,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.list() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useUserUpdateMutation = (
  options?: IMutationCallbacks<
    UserResponse,
    { href: string; body: PatchedUser }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    UserResponse,
    DrfAxiosError,
    { href: string; body: PatchedUser }
  >({
    mutationFn: async ({ href, body }: { href: string; body: PatchedUser }) => {
      const response = await axiosInstance.patch<UserResponse>(
        toProxyHref(href),
        body,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.href),
      });
      // Group member lists show usernames.
      void queryClient.invalidateQueries({ queryKey: groupKeys.details() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useUserDeleteMutation = (
  options?: IMutationCallbacks<void, UserResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, UserResponse>({
    mutationFn: async (user: UserResponse) => {
      const response = await axiosInstance.delete<void>(
        toProxyHref(user.pulp_href ?? ""),
      );
      return response.data;
    },
    onSuccess: async (data, user) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.list() });
      // Group member lists may include the deleted user.
      void queryClient.invalidateQueries({ queryKey: groupKeys.details() });
      // Drop the deleted record only once the caller's onSuccess (e.g. navigating
      // away from its detail page) settles; while that page is mounted, removing
      // or invalidating it would refetch a 404.
      await options?.onSuccess?.(data, user);
      queryClient.removeQueries({
        queryKey: userKeys.detail(user.pulp_href ?? ""),
      });
    },
    onError: options?.onError,
  });
};
