import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type {
  Group,
  GroupResponse,
  GroupRole,
  GroupUser,
  PaginatedGroupResponseList,
  PaginatedGroupRoleResponseList,
  PaginatedGroupUserResponseList,
  PatchedGroup,
} from "@app/client";
import {
  groupsCreate,
  groupsDelete,
  groupsList,
  groupsPartialUpdate,
  groupsRead,
  groupsRolesCreate,
  groupsRolesDelete,
  groupsRolesList,
  groupsUsersCreate,
  groupsUsersDelete,
  groupsUsersList,
} from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

export const GroupsQueryKey = "groups";

type GroupOrdering = NonNullable<
  Parameters<typeof groupsList>[0]["query"]
>["ordering"];

interface GroupListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<GroupOrdering>[number];
  name__icontains?: string;
}

export const groupsRootQueryOptions = queryOptions({
  queryKey: [GroupsQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const groupsListQueryOptions = (params: GroupListParams = {}) =>
  queryOptions({
    queryKey: [...groupsRootQueryOptions.queryKey, "list", params],
    queryFn: async (): Promise<PaginatedGroupResponseList> => {
      const response = await groupsList({
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
        throw new Error("Empty groups list response");
      }
      return response.data;
    },
  });

export const groupDetailQueryOptions = (groupHref: string) =>
  queryOptions({
    queryKey: [...groupsRootQueryOptions.queryKey, "detail", groupHref],
    queryFn: async (): Promise<GroupResponse> => {
      const response = await groupsRead({
        client,
        path: { group_href: groupHref },
      });
      if (!response.data) {
        throw new Error("Empty group detail response");
      }
      return response.data;
    },
    enabled: !!groupHref,
  });

export const groupUsersListQueryOptions = (groupHref: string) =>
  queryOptions({
    queryKey: [...groupsRootQueryOptions.queryKey, "users", groupHref],
    queryFn: async (): Promise<PaginatedGroupUserResponseList> => {
      const response = await groupsUsersList({
        client,
        path: { group_href: groupHref },
      });
      if (!response.data) {
        throw new Error("Empty group users list response");
      }
      return response.data;
    },
    enabled: !!groupHref,
  });

export const groupRolesListQueryOptions = (groupHref: string) =>
  queryOptions({
    queryKey: [...groupsRootQueryOptions.queryKey, "roles", groupHref],
    queryFn: async (): Promise<PaginatedGroupRoleResponseList> => {
      const response = await groupsRolesList({
        client,
        path: { group_href: groupHref },
      });
      if (!response.data) {
        throw new Error("Empty group roles list response");
      }
      return response.data;
    },
    enabled: !!groupHref,
  });

export const useGroupsListQuery = (params: GroupListParams = {}) => {
  return useQuery(groupsListQueryOptions(params));
};

export const useGroupDetailQuery = (groupHref: string) => {
  return useQuery(groupDetailQueryOptions(groupHref));
};

export const useGroupUsersListQuery = (groupHref: string) => {
  return useQuery(groupUsersListQueryOptions(groupHref));
};

export const useGroupRolesListQuery = (groupHref: string) => {
  return useQuery(groupRolesListQueryOptions(groupHref));
};

export const useGroupCreateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Group) => {
      const response = await groupsCreate({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        body,
      });
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
  return useMutation({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      body: PatchedGroup;
    }) => {
      const response = await groupsPartialUpdate({
        client,
        path: { group_href: href },
        body,
      });
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
  return useMutation({
    mutationFn: async (groupHref: string) => {
      const response = await groupsDelete({
        client,
        path: { group_href: groupHref },
      });
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
  return useMutation({
    mutationFn: async ({
      groupHref,
      body,
    }: {
      groupHref: string;
      body: GroupUser;
    }) => {
      const response = await groupsUsersCreate({
        client,
        path: { group_href: groupHref },
        body,
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupsRootQueryOptions.queryKey,
      });
    },
  });
};

export const useGroupUserDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userHref: string) => {
      const response = await groupsUsersDelete({
        client,
        path: { groups_user_href: userHref },
      });
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
  return useMutation({
    mutationFn: async ({
      groupHref,
      body,
    }: {
      groupHref: string;
      body: GroupRole;
    }) => {
      const response = await groupsRolesCreate({
        client,
        path: { group_href: groupHref },
        body,
      });
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
  return useMutation({
    mutationFn: async (roleHref: string) => {
      const response = await groupsRolesDelete({
        client,
        path: { groups_group_role_href: roleHref },
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupsRootQueryOptions.queryKey,
      });
    },
  });
};
