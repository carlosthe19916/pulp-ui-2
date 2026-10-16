---
name: queries
description: Public query-reading surface in client/src/app/queries — single inline-object args, explicit domain + hook injection, precondition-guard detail queries, no throw in queryFn.
globs: client/src/app/queries/**
---

# Query module conventions (`client/src/app/queries/`)

Every **public** query-reading function — the `*QueryOptions` factories and the
`use*Query` / `use*Queries` hooks — takes **exactly one argument: an inline-typed
object**, even for a single input. Reference: `users.ts`.

```ts
// QueryOptions factory — one object arg (takes the already-built href)
export const userDetailQueryOptions = ({
  userHref,
  options,
}: {
  userHref: string;
  options?: Omit<UseQueryOptions<UserResponse>, "queryKey" | "queryFn">;
}) => queryOptions({ ... });

// hook — one object arg
export const useUserDetailQuery = ({ userId }: { userId: string }) => { ... };
```

## Fields inside the object

- **`params`** — list/filter/ordering params (`ListParams<…>` / `AllListParams<…>`),
  optional with a `= {}` default when every field is optional.
- **`domain`** — passed explicitly to `*QueryOptions` (pure, no hooks); the **hook**
  injects it, so callers never pass it. Two injectors are in use:
  - `useDefaultDomain()` — users, groups, roles, signing-services, domains, tasks.
  - `useSelectedDomain()` — the plugin-typed/CRUD families: distributions,
    remotes, repositories, content, publications, file-content.
- **id vs href** — hooks come in two styles; either way the lower-level
  `*QueryOptions` receive the **already-built href**:
  - _id-building_ hooks take a resource **id** (`userId`) and build the href
    internally via `buildUserHref` (users, groups, domains, tasks).
  - _href-passthrough_ hooks take `{ href }` directly and build nothing
    (distributions, remotes, repositories, artifacts, signing-services).
- **`options`** — optional pass-through of extra React Query config, typed
  `Omit<UseQueryOptions<T>, "queryKey" | "queryFn">` (the two fields the module
  owns), spread **first** so the factory's `queryKey` / `queryFn` always win.

## Stay positional (not single-object)

Key factories (`userKeys.listQuery(domain, params)`, `detail(userHref)`),
mutations (`use*Mutation` and their call signatures), and private helpers
(`buildUserHref(userId, domain)`, `fetchAllPages(cb)`).

So the rule is narrowly scoped: the query-reading surface is single-object; keys,
mutations, and private helpers stay positional. Benefits: named call sites,
order-independence, and adding an optional field without touching callers.

## The precondition-guard pattern

For a detail / nested-resource query that only runs once an `href` / id is
present. Reference: `distributionDetailQueryOptions` + `useDistributionDetailQuery`
in `distributions.ts`.

- **`*QueryOptions` accepts `options?` and spreads it first, but sets no
  `enabled`.** It is the bare, composable config for direct consumers (route
  loaders, `prefetchQuery`), which are responsible for their own guard — the
  `!!href` check is a **precondition of the queryFn** (it builds
  `toProxyHref(href ?? "")`), so it belongs with the consumer that runs the query.

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
      queryFn: async (): Promise<DistributionResponse> =>
        (await axiosInstance.get<DistributionResponse>(toProxyHref(href ?? "")))
          .data,
    });
  ```

- **The `use*Query` hook owns the guard.** It does **not** accept `options`; it
  takes only the identifying args, spreads the bare options, and re-asserts
  `enabled` — so call sites just pass the nullable id/href, never `enabled`.

  ```ts
  export const useDistributionDetailQuery = ({
    href,
  }: {
    href: string | null;
  }) =>
    useQuery({
      ...distributionDetailQueryOptions({ href }),
      enabled: !!href, // precondition guard
    });
  ```

## Variant: caller-preference lists (no guard)

A list whose `enabled` is a genuine **caller preference** rather than a queryFn
precondition — e.g. `contentListQueryOptions` (fetch only once a content type is
chosen) — keeps `options` on **both** the `*QueryOptions` and the `use*Query`
hook, and the hook forwards it. There's no `!!href` guard to own, so enablement
flows straight from the caller through the pure spread. Still type `options` as
`Omit<UseQueryOptions<T>, "queryKey" | "queryFn">` and pure-spread it. Reference:
`content.ts`.

## Error typing (`TError`)

Every query-reading surface and mutation declares its error type explicitly — the
OpenAPI spec documents no error bodies, so the generated client has none. The
hand-authored error types live in **`queries/utils/openapiErrorTypes.ts`**:

- **`DrfAxiosError`** (`= AxiosError<IDrfValidationErrorData>`) — the **default**
  `TError` for every hook. All `queries/` endpoints hit `/pulp/api/v3/…` stock-DRF
  routes, whose errors are a validation dict / `non_field_errors` / scalar `detail`.
- **`PulpAxiosError`** (the wide `PulpErrorData` union) — use **only** when the
  error shape is genuinely unknown; it is just the fallback default of
  `IMutationCallbacks`.

Thread it explicitly (React Query v5 does not infer `TError`):

```ts
queryOptions<TData, DrfAxiosError>({ … })
useMutation<TData, DrfAxiosError, TVariables>({ … })
// options field: Omit<UseQueryOptions<T, DrfAxiosError>, "queryKey" | "queryFn">
// IMutationCallbacks<TData, TVariables> defaults TError = PulpAxiosError; pass
// DrfAxiosError as the 3rd arg so onError is granular.
```

## Response typing (`TData`)

`TData` mirrors the endpoint's declared **2xx** response(s) exactly — never `any`
or `unknown`:

- One documented success code → that single type (e.g. create `201` → entity;
  async create/delete `202` → `AsyncOperationResponse`; sync delete `204` → `void`).
- Both `200` **and** `202` (content/domain **PATCH** can finish sync or dispatch a
  task) → the union `EntityResponse | AsyncOperationResponse`. Admin PATCH
  (user/group/role) is `200`-only → single type, **not** a union.
- A plugin-neutral write body stays `Record<string, unknown>` (a typed dictionary,
  not `any`); it is not a `TData`/`TError`.

## Checklist

Pass/fail rubric for `/eval`. Check only the public query-reading surface in
changed `queries/` files.

- [ ] Every `*QueryOptions` factory and `use*Query` / `use*Queries` hook takes
      **exactly one inline-typed object arg** (even with a single field).
- [ ] Key factories, `use*Mutation` (and their call signatures), and private
      helpers (`build*Href`, `fetchAllPages`) stay **positional** — NOT converted
      to single-object.
- [ ] `*QueryOptions` receive the **already-built href**; id→href building lives in
      the id-style hook, never in the factory.
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
