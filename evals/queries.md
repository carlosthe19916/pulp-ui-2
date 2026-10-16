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
- [ ] `options` is typed `Omit<UseQueryOptions<T>, "queryKey" | "queryFn">` and
      **spread first** so the factory's `queryKey` / `queryFn` win.
- [ ] Precondition-guard detail queries: `*QueryOptions` sets **no `enabled`**; the
      `use*Query` hook owns the `enabled: !!href` guard and does **not** accept
      `options`. (Caller-preference lists keep `options` on both and forward it.)
- [ ] No `throw` inside a `queryFn` — errors propagate from the HTTP layer; non-HTTP
      empty results return a falsy sentinel handled in the loader/consumer.
