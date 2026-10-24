---
paths:
  - client/src/routes/**
  - client/src/router.ts
  - client/src/app/pages/**/*DetailRoute.tsx
---

# Route conventions (`client/src/routes/`)

Routes are file-based (`routeTree.gen.ts` is generated, never edited) and code-split
automatically (`autoCodeSplitting` in `vite.config.ts`), so don't add `lazy()`.

## Route files stay thin

A route file calls `createFileRoute(...)` and wires a component from `@app/pages/...`. No
page JSX, hooks or queries in it; the only inline JSX is `pendingComponent`.

```tsx
// routes/_authenticated/admin/users/index.ts — list routes have no loader
export const Route = createFileRoute("/_authenticated/admin/users/")({
  component: UserList,
});
```

## Detail-loader template

Every detail route loads its object before rendering. The loader is the only place an
href is built (see `queries.md`, "href only"):

```tsx
// routes/_authenticated/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/index.tsx
loader: async ({ context: { queryClient }, params: { pulpDomain, repositoryType, repositoryId } }) => {
  const domain = await ensureDomainFromParam(queryClient, pulpDomain); // ensureDefaultDomain for global objects
  const href = buildRepositoryHref(repositoryType, repositoryId, domain);
  if (!href) throw new Error("Unknown repository plugin type");
  await queryClient.ensureQueryData(repositoryDetailQueryOptions({ href }));
  return { href };
},
pendingComponent: () => <DetailRoutePending label="Loading repository" />,
errorComponent: DetailRouteError,
component: RepositoryDetailRoute,
```

- The pending label is `Loading <object>`, without an ellipsis.
- Loading, 403, 404 and error states belong to the route (`DetailRoutePending`,
  `DetailRouteError`). The page reads its data with `useSuspense*DetailQuery({ href })`
  and has no `entity ? … : null` guards.

## `*DetailRoute.tsx` adapters

The route's `component` is an adapter next to the page (`pages/<area>/<entity>-detail/`).
It reads the loader data or params through `getRouteApi` and passes plain props to the
page:

```tsx
const routeApi = getRouteApi("/_authenticated/admin/users/$userId");

export const UserDetailRoute: React.FC = () => {
  const { href } = routeApi.useLoaderData();
  return <UserDetail userHref={href} />;
};
```

Pages and components never read route params themselves. The one exception is the
selected domain, read via `useSelectedDomain()`.

## Search params and navigation

- `validateSearch` returns a typed object with a fallback for each key, never throws:
  `redirect: typeof search.redirect === "string" ? search.redirect : undefined` (`routes/login.ts`).
- Internal links are typed: `<Link to="/monitoring/$pulpDomain/tasks/$taskId" params={{ … }}>`
  and `void navigate({ to, params })`. Never build an internal URL with a template string.

## Checklist

Pass/fail rubric for `/eval`. Check changed files under `client/src/routes/`,
`router.ts` and `*DetailRoute.tsx`.

- [ ] Route files only wire `createFileRoute` to a page component (plus loader,
      `validateSearch`, `beforeLoad`, `pendingComponent`, `errorComponent`); no page logic.
- [ ] Detail loaders follow the template: resolve the domain, build the href, throw on an
      unknown type, `ensureQueryData`, `return { href }`; `DetailRoutePending` with
      `Loading <object>` and `DetailRouteError`.
- [ ] `*DetailRoute.tsx` adapters use `getRouteApi(...)` and pass props; pages don't read
      route params (except `useSelectedDomain`).
- [ ] `validateSearch` returns typed fallbacks; internal links use typed `to` + `params`.
- [ ] No `lazy()`, no edits to `routeTree.gen.ts`.
