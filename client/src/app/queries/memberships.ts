import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type { GroupResponse, GroupUser } from "@app/client";
import { groupKeys } from "./groups";
import { userKeys } from "./users";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { toProxyHref } from "./utils/pulpApi";
import { extractIdFromHref } from "./utils/pulpHref";
import { settleBatch } from "./utils/settleBatch";
import type { IBatchResult } from "./utils/settleBatch";

/*
 * User ↔ group membership, edited from either side. Pulp stores it once (the
 * nested `groups/{id}/users/` collection) but the UI reads it twice: each group
 * lists its users, and each user record embeds its `groups`. Every mutation here
 * therefore refreshes both sides via `invalidateMembership`.
 */

const invalidateMembership = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({ queryKey: userKeys.list() });
  void queryClient.invalidateQueries({ queryKey: userKeys.details() });
  void queryClient.invalidateQueries({ queryKey: groupKeys.details() });
};

const addMember = ({
  groupHref,
  username,
}: {
  groupHref: string;
  username: string;
}) =>
  axiosInstance.post(`${toProxyHref(groupHref)}users/`, {
    username,
  } satisfies GroupUser);

interface IGroupUsersBatchAddArgs {
  groupHref: string;
  /** For the caller's toast. */
  groupName: string;
  usernames: string[];
}

/** Adds multiple users to one group via parallel POSTs and invalidates once. */
export const useGroupUsersBatchAddMutation = (
  options?: IMutationCallbacks<IBatchResult, IGroupUsersBatchAddArgs>,
) => {
  const queryClient = useQueryClient();
  return useMutation<IBatchResult, DrfAxiosError, IGroupUsersBatchAddArgs>({
    mutationFn: ({ groupHref, usernames }: IGroupUsersBatchAddArgs) =>
      settleBatch({
        items: usernames,
        label: (username) => username,
        request: (username) => addMember({ groupHref, username }),
      }),
    onSuccess: (data, variables) => {
      invalidateMembership(queryClient);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

interface IUserGroupsBatchAddArgs {
  username: string;
  groups: GroupResponse[];
}

/** Adds one user to multiple groups via parallel POSTs and invalidates once. */
export const useUserGroupsBatchAddMutation = (
  options?: IMutationCallbacks<IBatchResult, IUserGroupsBatchAddArgs>,
) => {
  const queryClient = useQueryClient();
  return useMutation<IBatchResult, DrfAxiosError, IUserGroupsBatchAddArgs>({
    mutationFn: ({ username, groups }: IUserGroupsBatchAddArgs) =>
      settleBatch({
        items: groups,
        label: (group) => group.name,
        request: (group) =>
          addMember({ groupHref: group.pulp_href ?? "", username }),
      }),
    onSuccess: (data, variables) => {
      invalidateMembership(queryClient);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

interface IMembershipRemoveArgs {
  userHref: string;
  groupHref: string;
  /** Both names, for the caller's toast. */
  username: string;
  groupName: string;
}

/**
 * Ends a membership via the nested `{groupHref}users/{userId}/` path.
 * DELETEing the user's own href would delete the user instead.
 */
export const useMembershipRemoveMutation = (
  options?: IMutationCallbacks<void, IMembershipRemoveArgs>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, IMembershipRemoveArgs>({
    mutationFn: async ({ userHref, groupHref }: IMembershipRemoveArgs) => {
      await axiosInstance.delete<void>(
        `${toProxyHref(groupHref)}users/${extractIdFromHref(userHref)}/`,
      );
    },
    onSuccess: (data, variables) => {
      invalidateMembership(queryClient);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};
