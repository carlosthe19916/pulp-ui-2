import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

import { pulpApiPath, toProxyHref } from "./pulpApi";
import type { IPulpDomain } from "./pulpApi";

/** Aggregate collection prefix (shared by all plugin types in a family). */
export type ContentFamily =
  "remotes" | "repositories" | "distributions" | "publications";

/**
 * Narrowest key prefixes derived from a family's root query key. These mirror
 * the per-family factories: `entityListKey(root)` === `<name>Keys.list()` and
 * `entityDetailKey(root, href)` === `<name>Keys.detail(href)`. Kept as helpers
 * (not inline array literals) so mutations can reference them the same way
 * queries reference a factory leaf.
 */
const entityListKey = (rootQueryKey: readonly unknown[]) =>
  [...rootQueryKey, "list"] as const;

const entityDetailKey = (
  rootQueryKey: readonly unknown[],
  href: string | null,
) => [...rootQueryKey, "detail", href] as const;

/**
 * Generic, plugin-agnostic CRUD for the content families. Detail/update/delete
 * operate on the entity's own `pulp_href` (which embeds plugin+type), so they
 * need no plugin knowledge. Create posts to `<family>/<apiPath>/` where
 * `apiPath` comes from the chosen type's descriptor.
 */
export const entityDetailQueryOptions = <T = unknown>(
  rootQueryKey: readonly unknown[],
  href: string | null,
) =>
  queryOptions({
    queryKey: entityDetailKey(rootQueryKey, href),
    // `enabled: !!href` gates the fetch, so the `?? ""` is never reached at
    // runtime — it only satisfies `toProxyHref`'s `string` param for the null case.
    queryFn: async (): Promise<T> =>
      (await axiosInstance.get<T>(toProxyHref(href ?? ""))).data,
    enabled: !!href,
  });

export const useEntityDetailQuery = <T = unknown>(
  rootQueryKey: readonly unknown[],
  href: string | null,
) => useQuery(entityDetailQueryOptions<T>(rootQueryKey, href));

export const useSuspenseEntityDetailQuery = <T = unknown>(
  rootQueryKey: readonly unknown[],
  href: string | null,
) => useSuspenseQuery(entityDetailQueryOptions<T>(rootQueryKey, href));

/**
 * Resolve a bare resource UUID to its fully-typed `pulp_href` via the family's
 * aggregate endpoint (`<family>/?pulp_id__in=<id>`). The returned href embeds the
 * plugin/type path, so detail pages need only the id in their URL — no `type`
 * search param. Projected to `fields=pulp_href` to keep the payload minimal.
 *
 * Returns `null` when the id matches nothing (the aggregate endpoint answers 200
 * with an empty list, not a 404). Callers treat `null` as not-found — the route
 * loader throws on it so the `errorComponent` renders. We do not throw inside
 * `queryFn` (see AGENTS.md "## Coding Standards" → TanStack Query).
 */
export const entityHrefByIdQueryOptions = (
  rootQueryKey: readonly unknown[],
  family: ContentFamily,
  id: string,
  domain: IPulpDomain,
) =>
  queryOptions({
    queryKey: [...rootQueryKey, "href-by-id", family, domain, id] as const,
    queryFn: async (): Promise<string | null> => {
      const { data } = await axiosInstance.get<{
        results?: { pulp_href?: string }[];
      }>(pulpApiPath(`${family}/`, domain), {
        params: { pulp_id__in: [id], limit: 1, fields: ["pulp_href"] },
      });
      return data.results?.[0]?.pulp_href ?? null;
    },
    enabled: !!id,
  });

export const useSuspenseEntityHrefById = (
  rootQueryKey: readonly unknown[],
  family: ContentFamily,
  id: string,
  domain: IPulpDomain,
) =>
  useSuspenseQuery(
    entityHrefByIdQueryOptions(rootQueryKey, family, id, domain),
  );

export const useEntityCreateMutation = <T = unknown>(
  family: ContentFamily,
  rootQueryKey: readonly unknown[],
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      apiPath,
      body,
    }: {
      apiPath: string;
      body: Record<string, unknown>;
    }): Promise<T> =>
      (
        await axiosInstance.post<T>(
          pulpApiPath(`${family}/${apiPath}/`, domain),
          body,
        )
      ).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: entityListKey(rootQueryKey),
      });
    },
  });
};

export const useEntityUpdateMutation = (rootQueryKey: readonly unknown[]) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      href,
      body,
    }: {
      href: string;
      body: Record<string, unknown>;
    }): Promise<unknown> =>
      (await axiosInstance.patch(toProxyHref(href), body)).data,
    onSuccess: (_data, { href }) => {
      void queryClient.invalidateQueries({
        queryKey: entityListKey(rootQueryKey),
      });
      void queryClient.invalidateQueries({
        queryKey: entityDetailKey(rootQueryKey, href),
      });
    },
  });
};
