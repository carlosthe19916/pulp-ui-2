---
paths:
  - client/src/app/queries/**
---

# Query module conventions (`client/src/app/queries/`)

Scope: the **public query-reading surface** — `*QueryOptions` factories and `use*Query` /
`use*Queries` hooks. For mutations it sets only their `TError`/`TData` and which file they
live in.

## One inline-object arg

Every `*QueryOptions` factory and `use*Query`/`use*Queries` hook takes **exactly one
inline-typed object**, even for a single field:

```ts
export const widgetsListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IWidgetListParams;
}) => queryOptions<PaginatedWidgetResponseList, DrfAxiosError>({/* key, fn */});

export const useWidgetsListQuery = ({
  params,
}: {
  params: IWidgetListParams;
}) => {
  const domain = useSelectedDomain();
  return useQuery(widgetsListQueryOptions({ domain, params }));
};
```

- **`params`** — list/filter/ordering, always required, typed from the generated list data
  (`type IWidgetListParams = ListParams<WidgetsListData>`). `ListParams` makes `limit` required.
- **`domain`** — passed explicitly to the pure `*QueryOptions`; the **hook** injects it, so
  callers never pass it: `useDefaultDomain()` for global admin resources (users, groups, roles,
  signing services, domains), `useSelectedDomain()` for domain-scoped ones (repositories,
  remotes, distributions, publications, content, artifacts, tasks). An href-addressed query
  needs no domain.
- **`href`** — for a query that targets one resource (below).
- **`options`** — optional, typed
  `Omit<UseQueryOptions<T, DrfAxiosError>, "queryKey" | "queryFn">`, **spread first** so the
  factory's `queryKey`/`queryFn` win.

Key factories (`widgetKeys.listQuery(domain, params)`, `widgetKeys.detail(href)`),
`use*Mutation` (and their call signatures) and href builders (`buildWidgetHref(id, domain)`)
**stay positional**.

## href only, pure keys

- A query that targets one resource takes an **href** (the resource's, or the parent's for a
  nested list, read as `${toProxyHref(parentHref)}child/`), never an id.
- id→href building lives **only in route loaders**: the loader calls `build*Href(…)`, primes
  the query with `ensureQueryData` and returns `{ href }` for the page.
- `build*Href` returns the server form (`pulpHref()` → `{API_ROOT}…`), identical to the API's
  `pulp_href`, so a rebuilt href and a response href share one cache slot. Key factories stay
  pure: no `toProxyHref` in keys or at invalidation call sites; it is only for request URLs.
- Sub-resource keys nest under the parent's `detail(href)` (`widgetKeys.parts(href)`).

## One generic query per list endpoint

Each list endpoint has **one** generic `*QueryOptions` + `use*Query` typed with the full
`ListParams<…ListData>`; callers pass their own params.

- No per-use-case query (`use<X>By<Y>Query`, `use<X>For<Z>Query`) that bakes params in: it
  duplicates the generic hook and its key bypasses `<x>Keys.listQuery(domain, params)`.
- Polling or `enabled` on a list goes through `options`. Params shared by several callers are
  an exported constant or params builder (`ACTIVE_WIDGET_STATES`), not a hook.
- Separate queries are fine for a different endpoint or sub-resource, or a `use*Queries`
  fan-out. Anything else needs real evidence and a comment on the hook saying why.

## Precondition-guard detail queries

- `*QueryOptions` accepts `options?`, spreads it first and sets **no `enabled`**: route loaders
  and `prefetchQuery` own their guard.
- The `use*Query` hook takes only the identifying args (no `options`) and re-asserts
  `enabled: !!href`; without an href the queryFn would request `toProxyHref("")`:
  `useQuery({ ...widgetDetailQueryOptions({ href }), enabled: !!href })`.
- Variant: when `enabled` is a caller preference rather than a precondition (fetch only once
  the user picks a type), keep `options` on both factory and hook and forward it.

## Error and response typing

RQ v5 doesn't infer `TError`; declare it on every `queryOptions` / `useMutation` /
`UseQueryOptions`, from `queries/utils/openapiErrorTypes.ts`:

- `DrfAxiosError` by default (every `queries/` endpoint is a stock-DRF route).
- `PulpAxiosError` only when the shape is genuinely unknown; it is the fallback default of
  `IMutationCallbacks`, so pass `DrfAxiosError` as its 3rd arg.

`TData` mirrors the declared 2xx response, never `any`/`unknown`: one code → that type (`201`
entity, `202` `AsyncOperationResponse`, `204` `void`); `200` **and** `202` (e.g. a PATCH that
may finish inline or dispatch a task) → `EntityResponse | AsyncOperationResponse`. A
plugin-neutral write body stays `Record<string, unknown>`.

## No `throw` in a `queryFn`

Errors propagate from the HTTP layer; a manual `throw` triggers RQ retry on a non-recoverable
condition. A non-HTTP "not found" returns a falsy sentinel (`""`/`null`) and the route loader
or consumer throws: an href builder returns `null` for an unknown type and the detail loader
throws on it, which renders `DetailRouteError`.

## Family file layout (plugin axis)

- **`queries/<family>.ts`** is plugin-neutral: the cross-type list over the aggregate
  collection, the `*QueryKey` constant and `*Keys` factory, per-item actions and sub-resources
  uniform across plugins (a `sync/` action, a `versions/` sub-resource), and the typed
  detail-by-href (`<family>DetailQueryOptions`, generic over the response type when
  it varies by plugin; callers pass the concrete generated type, never a union).
- Actions on an existing object take its href; only create builds the endpoint from the
  catalog `apiPath`. Per-plugin body shape is modelled in the catalog, not by separate hooks.
- **`queries/<plugin>-<family>.ts`** holds only genuinely plugin-specific queries and reuses
  the base `*Keys`. No `<plugin><Family>DetailQueryOptions`.

## Checklist

Pass/fail rubric for `/eval`. Check changed `queries/` files: the query-reading surface in full,
mutations only for typing and file placement.

- [ ] Every `*QueryOptions` factory and `use*Query` / `use*Queries` hook takes **exactly one
      inline-typed object arg**. Key factories, `use*Mutation` and `build*Href` stay
      **positional**.
- [ ] List `params` are required and derive from the generated `*ListData` via `ListParams`.
- [ ] `domain` is passed explicitly to `*QueryOptions`; the **hook** injects it via
      `useDefaultDomain()` / `useSelectedDomain()` — callers never pass `domain`.
- [ ] `options` is typed `Omit<UseQueryOptions<T, DrfAxiosError>, "queryKey" | "queryFn">`
      and **spread first**.
- [ ] Queries targeting one resource take an **href**, never an id (nested lists take the
      parent's href); id→href building happens **only in route loaders**. Key factories stay
      **pure**; no `toProxyHref` in keys or invalidation call sites. Sub-resource keys nest
      under the parent's `detail(href)`.
- [ ] One generic query per list endpoint; no per-use-case query with built-in params (except
      a different endpoint/sub-resource, `use*Queries`, or a documented exception); list
      polling/`enabled` go through `options`.
- [ ] Precondition-guard detail queries: `*QueryOptions` sets **no `enabled`**; the hook owns
      `enabled: !!href` and does **not** accept `options`. Caller-preference lists keep
      `options` on both and forward it.
- [ ] Every `queryOptions` / `useMutation` / `UseQueryOptions` declares `TError` explicitly —
      `DrfAxiosError` by default, `PulpAxiosError` only when the shape is unknown.
- [ ] `TData` matches the declared 2xx response(s); no `any` / `unknown` as `TData` or
      `TError`.
- [ ] No `throw` inside a `queryFn`; non-HTTP empty results return a falsy sentinel.
- [ ] Plugin-neutral reads, uniform sub-resources, generic actions and typed detail-by-href
      live in `queries/<family>.ts`; `queries/<plugin>-<family>.ts` holds only plugin-specific
      queries and reuses the base `*Keys`.
