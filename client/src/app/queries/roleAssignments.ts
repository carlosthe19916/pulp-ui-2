import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  GroupRole,
  PaginatedGroupRoleResponseList,
  PaginatedUserRoleResponseList,
  UserRole,
  UsersRolesListData,
} from "@app/client";
import { groupKeys } from "./groups";
import { userKeys } from "./users";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { toProxyHref } from "./utils/pulpApi";
import { settleBatch } from "./utils/settleBatch";
import type { IBatchResult } from "./utils/settleBatch";

/*
 * Users and groups expose the same nested `{href}roles/` collection (pulpcore
 * `NestedRoleFilter`): identical params, response shape and assign/unassign
 * semantics, so one set of hooks serves both. `kind` only picks the key factory.
 */

/** Same query params for `users_roles_list` and `groups_roles_list`. */
export type IRoleAssignmentListParams = ListParams<UsersRolesListData>;

type PaginatedRoleAssignmentList =
  PaginatedUserRoleResponseList | PaginatedGroupRoleResponseList;

/** Each user/group keeps its assignments under its own detail key, so invalidating it refreshes them. */
const rolesKey = (kind: "user" | "group", href: string) =>
  kind === "user" ? userKeys.roles(href) : groupKeys.roles(href);

const rolesQueryKey = (
  kind: "user" | "group",
  href: string,
  params: IRoleAssignmentListParams,
) =>
  kind === "user"
    ? userKeys.rolesQuery(href, params)
    : groupKeys.rolesQuery(href, params);

export const roleAssignmentsListQueryOptions = ({
  kind,
  href,
  params,
  options,
}: {
  kind: "user" | "group";
  href: string;
  params: IRoleAssignmentListParams;
  options?: Omit<
    UseQueryOptions<PaginatedRoleAssignmentList, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<PaginatedRoleAssignmentList, DrfAxiosError>({
    ...options,
    queryKey: rolesQueryKey(kind, href, params),
    queryFn: async (): Promise<PaginatedRoleAssignmentList> => {
      const response = await axiosInstance.get<PaginatedRoleAssignmentList>(
        `${toProxyHref(href)}roles/`,
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

export const useRoleAssignmentsListQuery = ({
  kind,
  href,
  params,
  options,
}: {
  kind: "user" | "group";
  href: string;
  params: IRoleAssignmentListParams;
  options?: Omit<
    UseQueryOptions<PaginatedRoleAssignmentList, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  useQuery(roleAssignmentsListQueryOptions({ kind, href, params, options }));

interface IRoleAssignmentsBatchCreateArgs {
  kind: "user" | "group";
  href: string;
  /** Username or group name, for the caller's toast. */
  name: string;
  roleNames: string[];
}

/** Assigns multiple roles globally via parallel POSTs and invalidates once. */
export const useRoleAssignmentsBatchCreateMutation = (
  options?: IMutationCallbacks<IBatchResult, IRoleAssignmentsBatchCreateArgs>,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    IBatchResult,
    DrfAxiosError,
    IRoleAssignmentsBatchCreateArgs
  >({
    mutationFn: ({ href, roleNames }: IRoleAssignmentsBatchCreateArgs) =>
      settleBatch({
        items: roleNames,
        label: (role) => role,
        request: (role) =>
          axiosInstance.post(`${toProxyHref(href)}roles/`, {
            role,
            content_object: null,
          } satisfies UserRole & GroupRole),
      }),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: rolesKey(variables.kind, variables.href),
      });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

interface IRoleAssignmentDeleteArgs {
  kind: "user" | "group";
  /** The user's or group's href, whose roles are invalidated. */
  href: string;
  /** Username or group name, for the caller's toast. */
  name: string;
  /** The assignment's own nested `{href}roles/{id}/` href. */
  assignmentHref: string;
  /** For the caller's toast. */
  roleName: string;
}

export const useRoleAssignmentDeleteMutation = (
  options?: IMutationCallbacks<void, IRoleAssignmentDeleteArgs>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, IRoleAssignmentDeleteArgs>({
    mutationFn: async ({ assignmentHref }: IRoleAssignmentDeleteArgs) => {
      await axiosInstance.delete<void>(toProxyHref(assignmentHref));
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: rolesKey(variables.kind, variables.href),
      });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};
