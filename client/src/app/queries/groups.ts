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
  GroupRole,
  GroupRoleResponse,
  GroupsListData,
  GroupsRolesListData,
  GroupsUsersListData,
  GroupUser,
  GroupUserResponse,
  PaginatedGroupResponseList,
  PaginatedGroupRoleResponseList,
  PaginatedGroupUserResponseList,
  PatchedGroup,
} from "@app/client";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";
import { fetchAllPages } from "./utils/fetchAllPages";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";
import { buildGroupHref } from "./utils/pulpHref";

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
  detail: (groupHref: string) =>
    [...groupKeys.all(), "detail", groupHref] as const,
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
  rolesAllQuery: (groupHref: string) =>
    [...groupKeys.roles(groupHref), "all"] as const,
};

export const groupsListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IGroupListParams;
}) =>
  queryOptions<PaginatedGroupResponseList, DrfAxiosError>({
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

/** Roles tab renders the full list in one table (no pagination UI), so page through all. */
export const allGroupRolesListQueryOptions = ({
  groupHref,
  options,
}: {
  groupHref: string;
  options?: Omit<
    UseQueryOptions<PaginatedGroupRoleResponseList, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<PaginatedGroupRoleResponseList, DrfAxiosError>({
    ...options,
    queryKey: groupKeys.rolesAllQuery(groupHref),
    queryFn: async (): Promise<PaginatedGroupRoleResponseList> => {
      const { results, count } = await fetchAllPages<GroupRoleResponse>(
        async (offset, limit) => {
          const response =
            await axiosInstance.get<PaginatedGroupRoleResponseList>(
              `${toProxyHref(groupHref)}roles/`,
              { params: { offset, limit } },
            );
          return response.data;
        },
      );
      return { count, next: null, previous: null, results };
    },
  });

export const groupRolesListQueryOptions = ({
  groupHref,
  params,
  options,
}: {
  groupHref: string;
  params: IGroupRoleListParams;
  options?: Omit<
    UseQueryOptions<PaginatedGroupRoleResponseList, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<PaginatedGroupRoleResponseList, DrfAxiosError>({
    ...options,
    queryKey: groupKeys.rolesQuery(groupHref, params),
    queryFn: async (): Promise<PaginatedGroupRoleResponseList> => {
      const response = await axiosInstance.get<PaginatedGroupRoleResponseList>(
        `${toProxyHref(groupHref)}roles/`,
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

export const useGroupsListQuery = ({
  params,
}: {
  params: IGroupListParams;
}) => {
  const domain = useDefaultDomain();
  return useQuery(groupsListQueryOptions({ domain, params }));
};

export const useSuspenseGroupDetailQuery = ({
  groupId,
}: {
  groupId: string;
}) => {
  const domain = useDefaultDomain();
  return useSuspenseQuery(
    groupDetailQueryOptions({ groupHref: buildGroupHref(groupId, domain) }),
  );
};

export const useGroupUsersListQuery = ({
  groupId,
  params,
}: {
  groupId: string;
  params: IGroupUserListParams;
}) => {
  const domain = useDefaultDomain();
  const groupHref = buildGroupHref(groupId, domain);
  return useQuery({
    ...groupUsersListQueryOptions({ groupHref, params }),
    enabled: !!groupHref,
  });
};

export const useAllGroupUsersListQuery = ({ groupId }: { groupId: string }) => {
  const domain = useDefaultDomain();
  const groupHref = buildGroupHref(groupId, domain);
  return useQuery({
    ...allGroupUsersListQueryOptions({ groupHref }),
    enabled: !!groupHref,
  });
};

export const useGroupRolesListQuery = ({
  groupId,
  params,
}: {
  groupId: string;
  params: IGroupRoleListParams;
}) => {
  const domain = useDefaultDomain();
  const groupHref = buildGroupHref(groupId, domain);
  return useQuery({
    ...groupRolesListQueryOptions({ groupHref, params }),
    enabled: !!groupHref,
  });
};

export const useAllGroupRolesListQuery = ({ groupId }: { groupId: string }) => {
  const domain = useDefaultDomain();
  const groupHref = buildGroupHref(groupId, domain);
  return useQuery({
    ...allGroupRolesListQueryOptions({ groupHref }),
    enabled: !!groupHref,
  });
};

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
        queryKey: groupKeys.detail(toProxyHref(variables.href)),
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
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: groupKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: groupKeys.detail(toProxyHref(variables.href)),
      });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

/** Result of a batch add: usernames grouped by outcome. */
export interface IGroupUsersBatchResult {
  succeeded: string[];
  failed: string[];
}

/** Adds multiple users to a group via parallel POSTs and invalidates once. */
export const useGroupUsersBatchCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useDefaultDomain();
  return useMutation<
    IGroupUsersBatchResult,
    DrfAxiosError,
    { groupId: string; usernames: string[] }
  >({
    mutationFn: async ({
      groupId,
      usernames,
    }: {
      groupId: string;
      usernames: string[];
    }): Promise<IGroupUsersBatchResult> => {
      const usersUrl = `${toProxyHref(buildGroupHref(groupId, domain))}users/`;
      const results = await Promise.allSettled(
        usernames.map((username) =>
          axiosInstance.post<GroupUserResponse>(usersUrl, {
            username,
          } satisfies GroupUser),
        ),
      );
      const succeeded: string[] = [];
      const failed: string[] = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          succeeded.push(usernames[index]);
        } else {
          failed.push(usernames[index]);
        }
      });
      return { succeeded, failed };
    },
    onSuccess: (_data, { groupId }) => {
      void queryClient.invalidateQueries({
        queryKey: groupKeys.users(buildGroupHref(groupId, domain)),
      });
    },
  });
};

/**
 * Removes a user from a group. The group-users list returns each user's own
 * detail href (`/users/{pk}/`) — deleting that would delete the user from the
 * system. To only detach the membership we DELETE the nested
 * `groups/{groupId}/users/{userId}/` path instead.
 */
export const useGroupUserDeleteMutation = () => {
  const queryClient = useQueryClient();
  const domain = useDefaultDomain();
  return useMutation<void, DrfAxiosError, { groupId: string; userId: string }>({
    mutationFn: async ({
      groupId,
      userId,
    }: {
      groupId: string;
      userId: string;
    }) => {
      const response = await axiosInstance.delete<void>(
        pulpApiPath(`groups/${groupId}/users/${userId}/`, domain),
      );
      return response.data;
    },
    onSuccess: (_data, { groupId }) => {
      void queryClient.invalidateQueries({
        queryKey: groupKeys.users(buildGroupHref(groupId, domain)),
      });
    },
  });
};

/** Result of a batch role add: role names grouped by outcome. */
export interface IGroupRolesBatchResult {
  succeeded: string[];
  failed: string[];
}

/** Adds multiple roles to a group via parallel POSTs and invalidates once. */
export const useGroupRolesBatchCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useDefaultDomain();
  return useMutation<
    IGroupRolesBatchResult,
    DrfAxiosError,
    { groupId: string; roleNames: string[] }
  >({
    mutationFn: async ({
      groupId,
      roleNames,
    }: {
      groupId: string;
      roleNames: string[];
    }): Promise<IGroupRolesBatchResult> => {
      const rolesUrl = `${toProxyHref(buildGroupHref(groupId, domain))}roles/`;
      const results = await Promise.allSettled(
        roleNames.map((role) =>
          axiosInstance.post<GroupRoleResponse>(rolesUrl, {
            role,
            content_object: null,
          } satisfies GroupRole),
        ),
      );
      const succeeded: string[] = [];
      const failed: string[] = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          succeeded.push(roleNames[index]);
        } else {
          failed.push(roleNames[index]);
        }
      });
      return { succeeded, failed };
    },
    onSuccess: (_data, { groupId }) => {
      void queryClient.invalidateQueries({
        queryKey: groupKeys.roles(buildGroupHref(groupId, domain)),
      });
    },
  });
};

/**
 * Removes a role assignment from a group. The group-roles list returns each
 * assignment's own nested href (`groups/{groupId}/roles/{assignmentId}/`), so we
 * DELETE that href directly; `groupHref` drives the parent-roles invalidation.
 */
export const useGroupRoleDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    DrfAxiosError,
    { groupHref: string; roleAssignmentHref: string }
  >({
    mutationFn: async ({
      roleAssignmentHref,
    }: {
      groupHref: string;
      roleAssignmentHref: string;
    }) => {
      const response = await axiosInstance.delete<void>(
        toProxyHref(roleAssignmentHref),
      );
      return response.data;
    },
    onSuccess: (_data, { groupHref }) => {
      void queryClient.invalidateQueries({
        queryKey: groupKeys.roles(toProxyHref(groupHref)),
      });
    },
  });
};
