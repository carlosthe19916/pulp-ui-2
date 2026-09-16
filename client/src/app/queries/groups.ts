import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

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
import { useApiDomain } from "@app/hooks/useApiDomain";
import { fetchAllPages } from "./utils/fetchAllPages";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";
import { buildGroupHref, isEmptyDetailPayload } from "./utils/pulpHref";

export const GroupsQueryKey = "groups";

export type IGroupListParams = ListParams<GroupsListData>;

export type IGroupUserListParams = ListParams<GroupsUsersListData>;

export type IGroupRoleListParams = ListParams<GroupsRolesListData>;

export const groupsRootQueryOptions = queryOptions({
  queryKey: [GroupsQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const groupsListQueryOptions = (
  domain: IPulpDomain,
  params: IGroupListParams,
) =>
  queryOptions({
    queryKey: [...groupsRootQueryOptions.queryKey, "list", domain, params],
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

export const groupDetailQueryOptions = (groupHref: string) =>
  queryOptions({
    queryKey: [...groupsRootQueryOptions.queryKey, "detail", groupHref],
    queryFn: async (): Promise<GroupResponse> => {
      const response = await axiosInstance.get<GroupResponse>(
        toProxyHref(groupHref),
      );
      if (isEmptyDetailPayload(response.data) || !response.data.name) {
        throw new Error("Empty group detail response");
      }
      return response.data;
    },
    enabled: !!groupHref,
  });

export const groupUsersListQueryOptions = (
  groupHref: string,
  params: IGroupUserListParams,
) =>
  queryOptions({
    queryKey: [...groupsRootQueryOptions.queryKey, "users", groupHref, params],
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
    enabled: !!groupHref,
  });

/** `groups_users_list` supports only limit/offset, so fetch all and sort/filter in memory. */
export const allGroupUsersListQueryOptions = (groupHref: string) =>
  queryOptions({
    queryKey: [...groupsRootQueryOptions.queryKey, "users", "all", groupHref],
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
    enabled: !!groupHref,
  });

/** Roles tab renders the full list in one table (no pagination UI), so page through all. */
export const allGroupRolesListQueryOptions = (groupHref: string) =>
  queryOptions({
    queryKey: [...groupsRootQueryOptions.queryKey, "roles", "all", groupHref],
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
    enabled: !!groupHref,
  });

export const groupRolesListQueryOptions = (
  groupHref: string,
  params: IGroupRoleListParams,
) =>
  queryOptions({
    queryKey: [...groupsRootQueryOptions.queryKey, "roles", groupHref, params],
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
    enabled: !!groupHref,
  });

export const useGroupsListQuery = (params: IGroupListParams) => {
  const domain = useApiDomain();
  return useQuery(groupsListQueryOptions(domain, params));
};

export const useGroupDetailQuery = (groupId: string) => {
  const domain = useApiDomain();
  return useQuery(groupDetailQueryOptions(buildGroupHref(groupId, domain)));
};

export const useSuspenseGroupDetailQuery = (groupId: string) => {
  const domain = useApiDomain();
  return useSuspenseQuery(
    groupDetailQueryOptions(buildGroupHref(groupId, domain)),
  );
};

export const useGroupUsersListQuery = (
  groupId: string,
  params: IGroupUserListParams,
) => {
  const domain = useApiDomain();
  return useQuery(
    groupUsersListQueryOptions(buildGroupHref(groupId, domain), params),
  );
};

export const useAllGroupUsersListQuery = (groupId: string) => {
  const domain = useApiDomain();
  return useQuery(
    allGroupUsersListQueryOptions(buildGroupHref(groupId, domain)),
  );
};

export const useGroupRolesListQuery = (
  groupId: string,
  params: IGroupRoleListParams,
) => {
  const domain = useApiDomain();
  return useQuery(
    groupRolesListQueryOptions(buildGroupHref(groupId, domain), params),
  );
};

export const useAllGroupRolesListQuery = (groupId: string) => {
  const domain = useApiDomain();
  return useQuery(
    allGroupRolesListQueryOptions(buildGroupHref(groupId, domain)),
  );
};

export const useGroupCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async (body: Group) => {
      const response = await axiosInstance.post<GroupResponse>(
        pulpApiPath("groups/", domain),
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupsRootQueryOptions.queryKey,
      });
    },
  });
};

export const useGroupUpdateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async ({
      groupId,
      body,
    }: {
      groupId: string;
      body: PatchedGroup;
    }) => {
      const response = await axiosInstance.patch<GroupResponse>(
        toProxyHref(buildGroupHref(groupId, domain)),
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupsRootQueryOptions.queryKey,
      });
    },
  });
};

export const useGroupDeleteMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const response = await axiosInstance.delete<void>(
        toProxyHref(buildGroupHref(groupId, domain)),
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupsRootQueryOptions.queryKey,
      });
    },
  });
};

export const useGroupUserCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async ({
      groupId,
      body,
    }: {
      groupId: string;
      body: GroupUser;
    }) => {
      const response = await axiosInstance.post<GroupUserResponse>(
        `${toProxyHref(buildGroupHref(groupId, domain))}users/`,
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupsRootQueryOptions.queryKey,
      });
    },
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
  const domain = useApiDomain();
  return useMutation({
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
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupsRootQueryOptions.queryKey,
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
  const domain = useApiDomain();
  return useMutation({
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
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupsRootQueryOptions.queryKey,
      });
    },
  });
};

export const useGroupRoleCreateMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async ({
      groupId,
      body,
    }: {
      groupId: string;
      body: GroupRole;
    }) => {
      const response = await axiosInstance.post<GroupRoleResponse>(
        `${toProxyHref(buildGroupHref(groupId, domain))}roles/`,
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupsRootQueryOptions.queryKey,
      });
    },
  });
};

export const useGroupRoleDeleteMutation = () => {
  const queryClient = useQueryClient();
  const domain = useApiDomain();
  return useMutation({
    mutationFn: async ({
      groupId,
      assignmentId,
    }: {
      groupId: string;
      assignmentId: string;
    }) => {
      const response = await axiosInstance.delete<void>(
        pulpApiPath(`groups/${groupId}/roles/${assignmentId}/`, domain),
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupsRootQueryOptions.queryKey,
      });
    },
  });
};
