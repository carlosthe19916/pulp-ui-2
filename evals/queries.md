---
name: queries
description: Public query-reading surface in client/src/app/queries — single inline-object args, explicit domain + hook injection, precondition-guard detail queries, explicit TError/TData, no throw in queryFn.
globs: client/src/app/queries/**
---

# Query module conventions (`client/src/app/queries/`)

Scope: the **public query-reading surface** only — `*QueryOptions` factories and
`use*Query` / `use*Queries` hooks. Mutation signatures/toasts live in
`evals/toastr.md`; this spec only requires their `TError`/`TData` typing (below).

## One inline-object arg

Every `*QueryOptions` factory and `use*Query`/`use*Queries` hook takes **exactly
one inline-typed object**, even for a single field. Reference: `users.ts`.

```ts
// factory — one object arg; receives the already-built href / domain
export const usersListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IUserListParams;
}) => queryOptions<PaginatedUserResponseList, DrfAxiosError>({ ... });

// hook — one object arg; injects domain itself
export const useUsersListQuery = ({ params }: { params: IUserListParams }) => {
  const domain = useDefaultDomain();
  return useQuery(usersListQueryOptions({ domain, params }));
};
```

Object fields:

- **`params`** — list/filter/ordering (`ListParams<…>` / `AllListParams<…>`);
  optional with `= {}` when all fields are optional.
- **`domain`** — passed explicitly to the pure `*QueryOptions`; the **hook**
  injects it so callers never pass it. Injectors:
  - `useDefaultDomain()` — users, groups, roles, signing-services, domains.
  - `useSelectedDomain()` — distributions, remotes, repositories, content,
    publications, file-content.
  - `tasks.ts` uses **both** (mixed per query).
  - `artifacts.ts` uses neither (no domain).
- **id vs href** — `*QueryOptions` always get the **already-built href**. Hooks
  come in two kinds, chosen by what the caller already has:
  - _entry detail-by-id_ hooks fetch an entity straight from a route param, when
    no href exists yet — they take an **id** and build the href internally via
    `build*Href` (`useSuspenseGroupDetailQuery`, `useSuspenseTaskDetailQuery`).
    This is the only place id→href building lives.
  - _href-passthrough_ hooks — every other read, **including nested sub-resource
    lists** whose caller already holds the parent entity — take the resource's /
    parent's **`pulp_href`** directly and build nothing (groups users+roles, users
    roles, distributions, remotes, repositories, artifacts, signing-services). The
    API addresses a nested collection as `{parent_href}child/`, so passing the
    parent's own `pulp_href` matches the server contract — no `useDefaultDomain()`
    rebuild, no "resource lives in the default domain" assumption.
  - **Key factories stay pure** — `detail(href)` just appends the href, no
    `toProxyHref`. A query and its invalidation match because both derive the href
    from the **same source** (the entity's own `pulp_href`). The lone exception is
    an _entry detail-by-id_ query, whose key is built from `buildGroupHref(id)`
    (proxy form) while its update/delete carry the raw server `pulp_href` — there,
    and only there, the **invalidation call site** wraps `toProxyHref(variables.href)`.
- **`options`** — optional extra React Query config, typed
  `Omit<UseQueryOptions<T, DrfAxiosError>, "queryKey" | "queryFn">` (the two
  fields the module owns), **spread first** so the factory's `queryKey`/`queryFn`
  win.

## Stay positional (NOT single-object)

Key factories (`userKeys.listQuery(domain, params)`, `detail(userHref)`),
`use*Mutation` (and their call signatures), and private helpers
(`buildGroupHref(groupId, domain)`, `fetchAllPages(cb)`). Rule is narrow: only the
query-reading surface is single-object.

## Precondition-guard detail queries

For a detail/nested query that runs once an `href`/id exists. Reference:
`distributionDetailQueryOptions` + `useDistributionDetailQuery` (`distributions.ts`).

- **`*QueryOptions`**: accepts `options?`, spreads it first, sets **no `enabled`**
  — bare composable config for route loaders / `prefetchQuery`, which own their
  guard. The `!!href` check is a queryFn precondition (it builds
  `toProxyHref(href ?? "")`).

  ```ts
  export const distributionDetailQueryOptions = ({
    href,
    options,
  }: {
    href: string | null;
    options?: Omit<
      UseQueryOptions<DistributionResponse>,
      "queryKey" | "queryFn"
    >;
  }) =>
    queryOptions({
      ...options,
      queryKey: distributionKeys.detail(href ?? ""),
      queryFn: async () =>
        (await axiosInstance.get<DistributionResponse>(toProxyHref(href ?? "")))
          .data,
    });
  ```

- **`use*Query` hook** owns the guard: takes only the identifying args (no
  `options`), spreads the bare options, re-asserts `enabled`. Callers pass only
  the nullable id/href.

  ```ts
  export const useDistributionDetailQuery = ({
    href,
  }: {
    href: string | null;
  }) =>
    useQuery({ ...distributionDetailQueryOptions({ href }), enabled: !!href });
  ```

**Variant — caller-preference lists (no guard):** when `enabled` is a caller
preference, not a queryFn precondition (e.g. `contentListQueryOptions`, fetch only
once a type is chosen), keep `options` on **both** factory and hook and have the
hook forward it. Same `Omit<…>` typing, pure-spread. Reference: `content.ts`.

## Error typing (`TError`) — always explicit

RQ v5 does not infer `TError`; thread it. Types live in
`queries/utils/openapiErrorTypes.ts`:

- **`DrfAxiosError`** (`= AxiosError<IDrfValidationErrorData>`) — **default** for
  every hook; all `queries/` endpoints hit stock-DRF `/pulp/api/v3/…` routes
  (validation dict / `non_field_errors` / scalar `detail`).
- **`PulpAxiosError`** (wide `PulpErrorData` union) — only when the shape is
  genuinely unknown; it is the fallback default of `IMutationCallbacks`.

```ts
queryOptions<TData, DrfAxiosError>({ … });
useMutation<TData, DrfAxiosError, TVariables>({ … });
// options: Omit<UseQueryOptions<T, DrfAxiosError>, "queryKey" | "queryFn">
// IMutationCallbacks<TData, TVariables> defaults TError = PulpAxiosError — pass
// DrfAxiosError as the 3rd arg so onError is granular.
```

## Response typing (`TData`) — mirror the 2xx response

Never `any`/`unknown`:

- One success code → that type (create `201` → entity; async create/delete `202`
  → `AsyncOperationResponse`; sync delete `204` → `void`).
- Both `200` **and** `202` (content/domain **PATCH** may finish sync or dispatch)
  → `EntityResponse | AsyncOperationResponse`. Admin PATCH (user/group/role) is
  `200`-only → single type.
- A plugin-neutral write body stays `Record<string, unknown>` (not `any`); it is
  not a `TData`/`TError`.

## No `throw` in a `queryFn`

Errors propagate from the HTTP layer (a rejected axios request carries the
status/shape the app expects); a manual `throw` triggers RQ retry/backoff on a
non-recoverable condition. There are **zero** `throw`s in any `queries/*.ts`
queryFn. A non-HTTP "empty/not found" returns a **falsy sentinel** (`"" `/`null`,
matching the field's `enabled: !!value`) and is handled where the throw belongs —
the route `loader` (→ `errorComponent`) or the consumer.

## Checklist

Pass/fail rubric for `/eval`. Check only the public query-reading surface in
changed `queries/` files.

- [ ] Every `*QueryOptions` factory and `use*Query` / `use*Queries` hook takes
      **exactly one inline-typed object arg** (even with a single field).
- [ ] Key factories, `use*Mutation` (and their call signatures), and private
      helpers (`build*Href`, `fetchAllPages`) stay **positional** — NOT converted
      to single-object.
- [ ] `*QueryOptions` receive the **already-built href**. id→href building lives
      **only** in _entry detail-by-id_ hooks (`useSuspense*DetailQuery`, where no
      href exists yet); every other read — including nested sub-resource lists — is
      **href-passthrough** (takes the parent/resource `pulp_href`, no
      `build*Href`/`useDefaultDomain` rebuild). Key factories stay **pure** (no
      `toProxyHref`); normalize at the invalidation **call site** only when a key's
      two sides come from different href sources (the entry-detail case).
- [ ] `domain` is passed explicitly to `*QueryOptions`; the **hook** injects it via
      `useDefaultDomain()` / `useSelectedDomain()` — callers never pass `domain`.
- [ ] `options` is typed `Omit<UseQueryOptions<T, DrfAxiosError>, "queryKey" | "queryFn">`
      and **spread first** so the factory's `queryKey` / `queryFn` win.
- [ ] Every `queryOptions` / `useMutation` / `UseQueryOptions` declares its `TError`
      explicitly — `DrfAxiosError` by default, `PulpAxiosError` only when the shape
      is unknown. Error types come from `queries/utils/openapiErrorTypes.ts`.
- [ ] `TData` matches the endpoint's declared 2xx response(s) — single type, or the
      `Entity | AsyncOperationResponse` union when the spec declares both `200` and
      `202`. No `any` / `unknown` as a `TData` or `TError`.
- [ ] Precondition-guard detail queries: `*QueryOptions` sets **no `enabled`**; the
      `use*Query` hook owns the `enabled: !!href` guard and does **not** accept
      `options`. (Caller-preference lists keep `options` on both and forward it.)
- [ ] No `throw` inside a `queryFn` — errors propagate from the HTTP layer; non-HTTP
      empty results return a falsy sentinel handled in the loader/consumer.
