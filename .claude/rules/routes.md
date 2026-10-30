---
paths:
  - client/src/routes/**
  - client/src/router.ts
  - client/src/app/pages/**/*DetailRoute.tsx
  - client/src/app/pages/**/*EditRoute.tsx
---

# Route conventions (`client/src/routes/`)

## Route files

- A route file only wires `createFileRoute` options (`validateSearch`, `beforeLoad`, `loader`,
  `pendingComponent`, `errorComponent`, `component`) to a page from `@app/pages/...`. No page
  JSX, hooks or queries; no `lazy()` (routes are auto code-split).
- A pathless layout (`_authenticated.tsx`) has no `component`; the router renders `<Outlet />`.

## Detail routes

- The loader is the only place an href is built: `ensureDomainFromParam` (or
  `ensureDefaultDomain` for global objects) → `build*Href` from `@app/queries/…` (throw if it
  returns nothing) → `queryClient.query({ …, staleTime: "static" })` → return the href(s).
- `pendingComponent` is `DetailRoutePending` labelled `Loading <object>`, no ellipsis;
  `errorComponent` is `DetailRouteError`. The page uses `useSuspense*DetailQuery` and has no
  loading or not-found guards.
- `component` is a `*DetailRoute.tsx` adapter next to the page: it reads loader data and path
  params with `getRouteApi("<exact route id>")` and passes them as props.

```tsx
// routes/_authenticated/inventory/$pulpDomain/widgets/$widgetId/index.tsx
export const Route = createFileRoute(
  "/_authenticated/inventory/$pulpDomain/widgets/$widgetId/",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, widgetId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = buildWidgetHref(widgetId, domain);
    if (!href) throw new Error("Unknown widget");
    await queryClient.query({
      ...widgetDetailQueryOptions({ href }),
      staleTime: "static",
    });
    return { href };
  },
  pendingComponent: () => <DetailRoutePending label="Loading widget" />,
  errorComponent: DetailRouteError,
  component: WidgetDetailRoute,
});

// pages/inventory/widgets/widget-detail/WidgetDetailRoute.tsx
const routeApi = getRouteApi(
  "/_authenticated/inventory/$pulpDomain/widgets/$widgetId/",
);

export const WidgetDetailRoute: React.FC = () => {
  const { href } = routeApi.useLoaderData();
  return <WidgetDetail href={href} />;
};
```

## Create and edit routes

Form pages ([forms](forms.md)) sit beside the list and detail routes:

- `<entities>/create.ts` has no loader; `validateSearch` returns `{ type?: string }`, and the
  page reads and updates `?type=` itself (the Type select). The path never names a plugin.
- `<entities>/$<entity>Type/$<entity>Id/edit.tsx` is a detail route (same loader, pending and
  error components) that also throws when `getEntityForm({ …, mode: "edit" })` has no form for
  the type; its `*EditRoute.tsx` adapter passes `pulpDomain`, the type and the href.

## Params, search and links

- Pages and components never read path params; the one exception is `useSelectedDomain()`.
- A page may read and update its own route's search params only through
  `getRouteApi("<its route id>").useSearch()` / `.useNavigate()`.
- `validateSearch` returns a typed fallback for each key and never throws.
- Internal links use typed `to` + `params` (`<Link>`, `navigate`), never a template-string URL.

## Checklist

Pass/fail rubric for `/eval`. Check changed files under `client/src/routes/`, `router.ts`,
`*DetailRoute.tsx`, and pages that read search params.

- [ ] Route files only wire options to a page; pathless layouts have no `component`.
- [ ] Detail loaders resolve the domain, build the href with a `@app/queries` builder, throw on
      no href, prime the detail query with `query({ …, staleTime: "static" })`, and return
      the href(s).
- [ ] `DetailRoutePending` with `Loading <object>` (no ellipsis) and `DetailRouteError`.
- [ ] A create route has no loader and a `type` search param; an edit route is a detail route
      that also throws for a type without an edit form.
- [ ] Adapters read through `getRouteApi` with the exact route id and pass props.
- [ ] Pages read no path params (except `useSelectedDomain`) and read search only for their own
      route via `getRouteApi`.
- [ ] `validateSearch` has typed fallbacks; internal links are typed.
