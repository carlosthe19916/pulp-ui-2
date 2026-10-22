import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  Group,
  GroupResponse,
  GroupsListData,
  GroupsRolesListData,
  GroupsUsersListData,
  GroupUserResponse,
  PaginatedGroupResponseList,
  PaginatedGroupUserResponseList,
  PatchedGroup,
} from "@app/client";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";
import { userKeys } from "./users";
import { fetchAllPages } from "./utils/fetchAllPages";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const GroupsQueryKey = "groups";

export type IGroupListParams = ListParams<GroupsListData>;

export type IGroupUserListParams = ListParams<GroupsUsersListData>;

export type IGroupRoleListParams = ListParams<GroupsRolesListData>;

/**
 * Query-key factory mirroring the REST paths; identifying segments precede
 * params/`"all"` so a prefix invalidates all variants. Shared by the query
 * options and mutations to prevent key drift.
 */
export const groupKeys = {
  all: () => [GroupsQueryKey] as const,
  list: () => [...groupKeys.all(), "list"] as const,
  details: () => [...groupKeys.all(), "detail"] as const,
  detail: (groupHref: string) => [...groupKeys.details(), groupHref] as const,
  users: (groupHref: string) =>
    [...groupKeys.detail(groupHref), "users"] as const,
  roles: (groupHref: string) =>
    [...groupKeys.detail(groupHref), "roles"] as const,

  listQuery: (domain: IPulpDomain, params: IGroupListParams) =>
    [...groupKeys.list(), domain, params] as const,
  detailQuery: (groupHref: string) => groupKeys.detail(groupHref),
  usersQuery: (groupHref: string, params: IGroupUserListParams) =>
    [...groupKeys.users(groupHref), params] as const,
  usersAllQuery: (groupHref: string) =>
    [...groupKeys.users(groupHref), "all"] as const,
  rolesQuery: (groupHref: string, params: IGroupRoleListParams) =>
    [...groupKeys.roles(groupHref), params] as const,
};

export const groupsListQueryOptions = ({
  domain,
  params,
  options,
}: {
  domain: IPulpDomain;
  params: IGroupListParams;
  options?: Omit<
    UseQueryOptions<PaginatedGroupResponseList, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<PaginatedGroupResponseList, DrfAxiosError>({
    ...options,
    queryKey: groupKeys.listQuery(domain, params),
    queryFn: async (): Promise<PaginatedGroupResponseList> => {
      const response = await axiosInstance.get<PaginatedGroupResponseList>(
        pulpApiPath("groups/", domain),
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

export const groupDetailQueryOptions = ({
  groupHref,
  options,
}: {
  groupHref: string;
  options?: Omit<
    UseQueryOptions<GroupResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<GroupResponse, DrfAxiosError>({
    ...options,
    queryKey: groupKeys.detailQuery(groupHref),
    queryFn: async (): Promise<GroupResponse> => {
      const response = await axiosInstance.get<GroupResponse>(
        toProxyHref(groupHref),
      );
      return response.data;
    },
  });

export const groupUsersListQueryOptions = ({
  groupHref,
  params,
  options,
}: {
  groupHref: string;
  params: IGroupUserListParams;
  options?: Omit<
    UseQueryOptions<PaginatedGroupUserResponseList, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<PaginatedGroupUserResponseList, DrfAxiosError>({
    ...options,
    queryKey: groupKeys.usersQuery(groupHref, params),
    queryFn: async (): Promise<PaginatedGroupUserResponseList> => {
      const response = await axiosInstance.get<PaginatedGroupUserResponseList>(
        `${toProxyHref(groupHref)}users/`,
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

/** `groups_users_list` supports only limit/offset, so fetch all and sort/filter in memory. */
export const allGroupUsersListQueryOptions = ({
  groupHref,
  options,
}: {
  groupHref: string;
  options?: Omit<
    UseQueryOptions<PaginatedGroupUserResponseList, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<PaginatedGroupUserResponseList, DrfAxiosError>({
    ...options,
    queryKey: groupKeys.usersAllQuery(groupHref),
    queryFn: async (): Promise<PaginatedGroupUserResponseList> => {
      const { results, count } = await fetchAllPages<GroupUserResponse>(
        async (offset, limit) => {
          const response =
            await axiosInstance.get<PaginatedGroupUserResponseList>(
              `${toProxyHref(groupHref)}users/`,
              { params: { offset, limit } },
            );
          return response.data;
        },
      );
      return { count, next: null, previous: null, results };
    },
  });

export const useGroupsListQuery = ({
  params,
  options,
}: {
  params: IGroupListParams;
  options?: Omit<
    UseQueryOptions<PaginatedGroupResponseList, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) => {
  const domain = useDefaultDomain();
  return useQuery(groupsListQueryOptions({ domain, params, options }));
};

export const useSuspenseGroupDetailQuery = ({
  groupHref,
}: {
  groupHref: string;
}) => useSuspenseQuery(groupDetailQueryOptions({ groupHref }));

export const useGroupUsersListQuery = ({
  groupHref,
  params,
}: {
  groupHref: string;
  params: IGroupUserListParams;
}) =>
  useQuery({
    ...groupUsersListQueryOptions({ groupHref, params }),
    enabled: !!groupHref,
  });

export const useAllGroupUsersListQuery = ({
  groupHref,
}: {
  groupHref: string;
}) =>
  useQuery({
    ...allGroupUsersListQueryOptions({ groupHref }),
    enabled: !!groupHref,
  });

export const useGroupCreateMutation = (
  options?: IMutationCallbacks<GroupResponse, Group>,
) => {
  const queryClient = useQueryClient();
  const domain = useDefaultDomain();
  return useMutation<GroupResponse, DrfAxiosError, Group>({
    mutationFn: async (body: Group) => {
      const response = await axiosInstance.post<GroupResponse>(
        pulpApiPath("groups/", domain),
        body,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: groupKeys.list() });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useGroupUpdateMutation = (
  options?: IMutationCallbacks<
    GroupResponse,
    { href: string; name: string; body: PatchedGroup }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    GroupResponse,
    DrfAxiosError,
    { href: string; name: string; body: PatchedGroup }
  >({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      name: string;
      body: PatchedGroup;
    }) => {
      const response = await axiosInstance.patch<GroupResponse>(
        toProxyHref(href),
        body,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: groupKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: groupKeys.detail(variables.href),
      });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useGroupDeleteMutation = (
  options?: IMutationCallbacks<void, { href: string; name: string }>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, { href: string; name: string }>({
    mutationFn: async ({ href }: { href: string; name: string }) => {
      const response = await axiosInstance.delete<void>(toProxyHref(href));
      return response.data;
    },
    onSuccess: async (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: groupKeys.list() });
      // User records embed their groups (list column + detail Groups tab).
      void queryClient.invalidateQueries({ queryKey: userKeys.list() });
      void queryClient.invalidateQueries({ queryKey: userKeys.details() });
      // Drop the deleted record only once the caller's onSuccess (e.g. navigating
      // away from its detail page) settles; while that page is mounted, removing
      // or invalidating it would refetch a 404.
      await options?.onSuccess?.(data, variables);
      queryClient.removeQueries({ queryKey: groupKeys.detail(variables.href) });
    },
    onError: options?.onError,
  });
};
