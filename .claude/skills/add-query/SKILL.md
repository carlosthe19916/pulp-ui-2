---
name: add-query
description: >-
  Use when adding or changing a TanStack Query read (queryOptions, useQuery,
  useSuspenseQuery, useQueries) in client/src/app/queries — a list query, a
  detail-by-href query, a nested sub-resource list or a use*Queries fan-out.
  Gives the file to put it in, the key/factory/hook templates and the steps to
  wire it from a route loader.
---

# Add a TanStack query

The constraints are in `.rulesync/rules/queries.md` (read it first) and, for callers,
`.rulesync/rules/list-reads.md`. This skill is the how-to. The snippets use a made-up `widget`
resource; swap in the real generated types.

## Steps

1. **Find the endpoint** in the generated client and its declared 2xx responses; the
   `pulp-api` skill covers the lookup and API quirks.
2. **Check it doesn't exist.** A list endpoint has one generic query; if one exists, pass new
   `params` (or `options` for polling / `enabled`) instead of adding a hook.
3. **Pick the file:**
   - cross-type list, a uniform sub-resource or action, or typed detail-by-href →
     `queries/<family>.ts`;
   - a sub-resource that genuinely varies by plugin, or a typed list when the aggregate
     returns a union → `queries/<plugin>-<family>.ts`, reusing the base `*Keys`;
   - a resource with a single endpoint (an admin resource) → `queries/<resource>.ts`.
4. **Key:** add to the resource's `*Keys` factory (positional args).
5. **Factory + hook** from the templates below, typed `queryOptions<TData, DrfAxiosError>`.
6. **Detail page?** The route loader builds the href and primes the query; the page reads it
   with `useSuspense*DetailQuery({ href })` (`.rulesync/rules/routes.md`).
7. **Test** pure pieces (key factories, href builders) next to the module.

## Keys

```ts
export const WidgetsQueryKey = "widgets";

export const widgetKeys = {
  all: () => [WidgetsQueryKey] as const,
  list: () => [...widgetKeys.all(), "list"] as const,
  listQuery: (domain: IPulpDomain, params: IWidgetListParams) =>
    [...widgetKeys.list(), domain, params] as const,
  details: () => [...widgetKeys.all(), "detail"] as const,
  detail: (href: string) => [...widgetKeys.details(), href] as const,
  // sub-resources nest under the parent's detail key
  parts: (href: string) => [...widgetKeys.detail(href), "parts"] as const,
};
```

Invalidate `widgetKeys.list()` after a create, `widgetKeys.detail(href)` after an update.

## List query

```ts
export type IWidgetListParams = ListParams<WidgetsListData>;

export const widgetsListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IWidgetListParams;
}) =>
  queryOptions<PaginatedWidgetResponseList, DrfAxiosError>({
    queryKey: widgetKeys.listQuery(domain, params),
    queryFn: async (): Promise<PaginatedWidgetResponseList> => {
      const response = await axiosInstance.get<PaginatedWidgetResponseList>(
        pulpApiPath("widgets/", domain),
        {
          params: {
            ...params,
            // Pulp's `ordering` is an array param
            ordering: params.ordering ? [params.ordering] : undefined,
          },
        },
      );
      return response.data;
    },
  });

export const useWidgetsListQuery = ({
  params,
}: {
  params: IWidgetListParams;
}) => {
  const domain = useSelectedDomain(); // useDefaultDomain() for global admin resources
  return useQuery(widgetsListQueryOptions({ domain, params }));
};
```

Callers define the params; shared ones are a constant, not a hook:

```ts
// ✗ useWidgetsByOwnerListQuery({ owner, limit, offset });
useWidgetsListQuery({
  params: {
    owner: ownerHref,
    state__in: [...ACTIVE_WIDGET_STATES],
    ordering: "-pulp_created",
    limit,
    offset,
  },
});
```

## Detail query (precondition guard)

The factory is bare (loaders own their guard); the hook owns `enabled` and takes no `options`.

```ts
export const widgetDetailQueryOptions = ({
  href,
  options,
}: {
  href: string | null;
  options?: Omit<
    UseQueryOptions<WidgetResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<WidgetResponse, DrfAxiosError>({
    ...options,
    queryKey: widgetKeys.detail(href ?? ""),
    queryFn: async (): Promise<WidgetResponse> =>
      (await axiosInstance.get<WidgetResponse>(toProxyHref(href ?? ""))).data,
  });

export const useWidgetDetailQuery = ({ href }: { href: string | null }) =>
  useQuery({ ...widgetDetailQueryOptions({ href }), enabled: !!href });

export const useSuspenseWidgetDetailQuery = ({ href }: { href: string }) =>
  useSuspenseQuery(widgetDetailQueryOptions({ href }));
```

When the response type varies by plugin, make the detail query generic over it and let each
caller pass the concrete generated type, never a union:

```ts
export const widgetDetailQueryOptions = <T = WidgetResponse>({
  href,
  options,
}: {
  href: string | null;
  options?: Omit<UseQueryOptions<T, DrfAxiosError>, "queryKey" | "queryFn">;
}) =>
  queryOptions<T, DrfAxiosError>({
    ...options,
    queryKey: widgetKeys.detail(href ?? ""),
    queryFn: async (): Promise<T> =>
      (await axiosInstance.get<T>(toProxyHref(href ?? ""))).data,
  });

export const useWidgetDetailQuery = <T = WidgetResponse>({
  href,
}: {
  href: string | null;
}) => useQuery({ ...widgetDetailQueryOptions<T>({ href }), enabled: !!href });

// caller: useWidgetDetailQuery<FooWidgetResponse>({ href })
```

## Caller-preference list (no guard)

When `enabled` is the caller's choice (fetch once a type is picked), keep `options` on both
factory and hook and forward it:

```ts
export const useWidgetsListQuery = ({
  params,
  options,
}: {
  params: IWidgetListParams;
  options?: Omit<
    UseQueryOptions<PaginatedWidgetResponseList, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) => {
  const domain = useSelectedDomain();
  return useQuery(widgetsListQueryOptions({ domain, params, options }));
};
```

## Nested sub-resource list

Takes the parent's href, requests the child path under it and keys under the parent:

```ts
export const widgetPartsListQueryOptions = ({
  widgetHref,
  params,
}: {
  widgetHref: string;
  params: IWidgetPartsListParams;
}) =>
  queryOptions<PaginatedWidgetPartResponseList, DrfAxiosError>({
    queryKey: [...widgetKeys.parts(widgetHref), params],
    queryFn: async () =>
      (
        await axiosInstance.get<PaginatedWidgetPartResponseList>(
          `${toProxyHref(widgetHref)}parts/`,
          { params },
        )
      ).data,
  });
```
