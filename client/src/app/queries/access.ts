import { useCallback } from "react";

import type { UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import {
  queryOptions,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  MyPermissionsResponse,
  NestedRole,
  NestedRoleResponse,
  ObjectRolesResponse,
} from "@app/client";

import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { toProxyHref } from "./utils/pulpApi";

export const AccessQueryKey = "access";

/**
 * Object-level access, keyed by the object's href: who holds which role on it
 * (`list_roles/`) and what the current user may do (`my_permissions/`).
 */
export const accessKeys = {
  all: () => [AccessQueryKey] as const,
  object: (href: string) => [...accessKeys.all(), href] as const,
  roles: (href: string) => [...accessKeys.object(href), "roles"] as const,
  myPermissions: (href: string) =>
    [...accessKeys.object(href), "my-permissions"] as const,
};

export const objectRolesQueryOptions = ({
  href,
  options,
}: {
  href: string;
  options?: Omit<
    UseQueryOptions<ObjectRolesResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<ObjectRolesResponse, DrfAxiosError>({
    ...options,
    queryKey: accessKeys.roles(href),
    queryFn: async () =>
      (
        await axiosInstance.get<ObjectRolesResponse>(
          `${toProxyHref(href)}list_roles/`,
        )
      ).data,
  });

export const useObjectRolesQuery = ({ href }: { href: string }) =>
  useQuery({ ...objectRolesQueryOptions({ href }), enabled: !!href });

export const myPermissionsQueryOptions = ({
  href,
  options,
}: {
  href: string;
  options?: Omit<
    UseQueryOptions<MyPermissionsResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<MyPermissionsResponse, DrfAxiosError>({
    ...options,
    queryKey: accessKeys.myPermissions(href),
    queryFn: async () =>
      (
        await axiosInstance.get<MyPermissionsResponse>(
          `${toProxyHref(href)}my_permissions/`,
        )
      ).data,
    // Permissions change rarely; don't refetch on every mount.
    staleTime: 60_000,
  });

export const useMyPermissionsQuery = ({ href }: { href: string }) =>
  useQuery({ ...myPermissionsQueryOptions({ href }), enabled: !!href });

/** One `my_permissions/` read per href (a list page's rows), keyed by href. */
export const useMyPermissionsQueries = ({
  hrefs,
}: {
  hrefs: string[];
}): Map<string, MyPermissionsResponse> => {
  // `combine` must be referentially stable or useQueries returns a new Map every
  // render; key it on the href list's content, not the (often fresh) array.
  const hrefsKey = hrefs.join("\n");
  const combine = useCallback(
    (
      results: UseQueryResult<MyPermissionsResponse, DrfAxiosError>[],
    ): Map<string, MyPermissionsResponse> => {
      const byHref = new Map<string, MyPermissionsResponse>();
      hrefsKey.split("\n").forEach((href, index) => {
        const data = results[index]?.data;
        if (data) byHref.set(href, data);
      });
      return byHref;
    },
    [hrefsKey],
  );
  return useQueries({
    queries: hrefs.map((href) => ({
      ...myPermissionsQueryOptions({ href }),
      enabled: !!href,
    })),
    combine,
  });
};

export interface IObjectRoleVariables {
  href: string;
  body: NestedRole;
}

const useObjectRoleMutation = ({
  action,
  options,
}: {
  action: "add_role" | "remove_role";
  options?: IMutationCallbacks<NestedRoleResponse, IObjectRoleVariables>;
}) => {
  const queryClient = useQueryClient();
  return useMutation<NestedRoleResponse, DrfAxiosError, IObjectRoleVariables>({
    mutationFn: async ({ href, body }) =>
      (
        await axiosInstance.post<NestedRoleResponse>(
          `${toProxyHref(href)}${action}/`,
          body,
        )
      ).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: accessKeys.object(vars.href),
      });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

/** Grants a role on one object to users and/or groups. */
export const useAddObjectRoleMutation = (
  options?: IMutationCallbacks<NestedRoleResponse, IObjectRoleVariables>,
) => useObjectRoleMutation({ action: "add_role", options });

/** Revokes a role on one object from users and/or groups. */
export const useRemoveObjectRoleMutation = (
  options?: IMutationCallbacks<NestedRoleResponse, IObjectRoleVariables>,
) => useObjectRoleMutation({ action: "remove_role", options });
