import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  Group,
  GroupResponse,
  GroupRole,
  GroupRoleResponse,
  GroupsListData,
  GroupUser,
  GroupUserResponse,
  PaginatedGroupResponseList,
  PaginatedGroupRoleResponseList,
  PaginatedGroupUserResponseList,
  PatchedGroup,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const GroupsQueryKey = "groups";

type GroupOrdering = NonNullable<GroupsListData["query"]>["ordering"];

interface IGroupListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<GroupOrdering>[number];
  name__icontains?: string;
}

export const groupsRootQueryOptions = queryOptions({
  queryKey: [GroupsQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const groupsListQueryOptions = (
  domain: IPulpDomain,
  params: IGroupListParams = {},
) =>
  queryOptions({
    queryKey: [...groupsRootQueryOptions.queryKey, "list", domain, params],
    queryFn: async (): Promise<PaginatedGroupResponseList> => {
      const response = await axiosInstance.get<PaginatedGroupResponseList>(
        pulpApiPath("groups/", domain),
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
        throw new Error("Empty groups list response");
      }
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
      const response = await axiosInstance.get<PaginatedGroupUserResponseList>(
        `${toProxyHref(groupHref)}users/`,
      );
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
      const response = await axiosInstance.get<PaginatedGroupRoleResponseList>(
        `${toProxyHref(groupHref)}roles/`,
      );
      if (!response.data) {
        throw new Error("Empty group roles list response");
      }
      return response.data;
    },
    enabled: !!groupHref,
  });

export const useGroupsListQuery = (params: IGroupListParams = {}) => {
  const domain = useApiDomain();
  return useQuery(groupsListQueryOptions(domain, params));
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
  return useMutation({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      body: PatchedGroup;
    }) => {
      const response = await axiosInstance.patch<GroupResponse>(
        toProxyHref(href),
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
  return useMutation({
    mutationFn: async (groupHref: string) => {
      const response = await axiosInstance.delete<void>(toProxyHref(groupHref));
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
      const response = await axiosInstance.post<GroupUserResponse>(
        `${toProxyHref(groupHref)}users/`,
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

export const useGroupUserDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userHref: string) => {
      const response = await axiosInstance.delete<void>(toProxyHref(userHref));
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
      const response = await axiosInstance.post<GroupRoleResponse>(
        `${toProxyHref(groupHref)}roles/`,
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
  return useMutation({
    mutationFn: async (roleHref: string) => {
      const response = await axiosInstance.delete<void>(toProxyHref(roleHref));
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupsRootQueryOptions.queryKey,
      });
    },
  });
};
