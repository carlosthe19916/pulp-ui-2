import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedUserResponseList,
  PaginatedUserRoleResponseList,
  PatchedUser,
  UserResponse,
  UserRoleResponse,
  UsersListData,
  UsersRolesListData,
  UserWritable,
} from "@app/client";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";
import { fetchAllPages } from "./utils/fetchAllPages";
import type { AllListParams, ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const UsersQueryKey = "users";

export type IUserListParams = ListParams<UsersListData>;

export type IUserRoleListParams = ListParams<UsersRolesListData>;

export type IAllUserRoleListParams = AllListParams<UsersRolesListData>;

/**
 * Query-key factory mirroring the REST paths; identifying segments precede
 * params/`"all"` so a prefix invalidates all variants. Shared by the query
 * options and mutations to prevent key drift.
 */
export const userKeys = {
  all: () => [UsersQueryKey] as const,
  list: () => [...userKeys.all(), "list"] as const,
  detail: (userHref: string) =>
    [...userKeys.all(), "detail", userHref] as const,
  roles: (userHref: string) => [...userKeys.detail(userHref), "roles"] as const,

  listQuery: (domain: IPulpDomain, params: IUserListParams) =>
    [...userKeys.list(), domain, params] as const,
  detailQuery: (userHref: string) => userKeys.detail(userHref),
  rolesQuery: (userHref: string, params: IUserRoleListParams) =>
    [...userKeys.roles(userHref), params] as const,
  rolesAllQuery: (userHref: string, params: IAllUserRoleListParams) =>
    [...userKeys.roles(userHref), "all", params] as const,
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

/** The dual-list role editor needs every assignment at once, so page through the whole list. */
export const allUserRolesListQueryOptions = ({
  userHref,
  params = {},
  options,
}: {
  userHref: string;
  params?: IAllUserRoleListParams;
  options?: Omit<
    UseQueryOptions<PaginatedUserRoleResponseList, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<PaginatedUserRoleResponseList, DrfAxiosError>({
    ...options,
    queryKey: userKeys.rolesAllQuery(userHref, params),
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
  });

export const useUsersListQuery = ({ params }: { params: IUserListParams }) => {
  const domain = useDefaultDomain();
  return useQuery(usersListQueryOptions({ domain, params }));
};

export const useAllUserRolesListQuery = ({
  userHref,
  params = {},
}: {
  userHref: string;
  params?: IAllUserRoleListParams;
}) =>
  useQuery({
    ...allUserRolesListQueryOptions({ userHref, params }),
    enabled: !!userHref,
  });

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
    { href: string; name: string; body: PatchedUser }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    UserResponse,
    DrfAxiosError,
    { href: string; name: string; body: PatchedUser }
  >({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      name: string;
      body: PatchedUser;
    }) => {
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
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useUserDeleteMutation = (
  options?: IMutationCallbacks<void, { href: string; name: string }>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, { href: string; name: string }>({
    mutationFn: async ({ href }: { href: string; name: string }) => {
      const response = await axiosInstance.delete<void>(toProxyHref(href));
      return response.data;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.href),
      });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

interface IUserRolesSyncArgs {
  userHref: string;
  /** Role names to assign. */
  toAdd: string[];
  /** Assignment IDs to unassign. */
  toRemove: string[];
}

/** Batches role assigns/unassigns for one user and invalidates once. */
export const useUserRolesSyncMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, IUserRolesSyncArgs>({
    mutationFn: async ({ userHref, toAdd, toRemove }: IUserRolesSyncArgs) => {
      const rolesUrl = `${toProxyHref(userHref)}roles/`;
      await Promise.all([
        ...toAdd.map((role) =>
          axiosInstance.post<UserRoleResponse>(rolesUrl, {
            role,
            content_object: null,
          }),
        ),
        ...toRemove.map((assignmentId) =>
          axiosInstance.delete<void>(`${rolesUrl}${assignmentId}/`),
        ),
      ]);
    },
    onSuccess: (_data, { userHref }) => {
      void queryClient.invalidateQueries({
        queryKey: userKeys.roles(userHref),
      });
    },
  });
};
