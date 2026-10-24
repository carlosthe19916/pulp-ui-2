---
name: routes
description: TanStack Router file routes — thin route files, detail loaders that build the href and own pending/error states, getRouteApi adapters, which params and search a page may read, typed links.
root: false
targets: ["claudecode", "cursor"]
globs:
  [
    "client/src/routes/**",
    "client/src/router.ts",
    "client/src/app/pages/**/*DetailRoute.tsx",
  ]
---

# Route conventions (`client/src/routes/`)

## Route files

- A route file only wires `createFileRoute` options (`validateSearch`, `beforeLoad`, `loader`,
  `pendingComponent`, `errorComponent`, `component`) to a page from `@app/pages/...`. No page
  JSX, hooks or queries; no `lazy()` (routes are auto code-split).
- A pathless layout (`_authenticated.tsx`) has no `component`; the router renders `<Outlet />`.

## Detail routes

Reference: `routes/_authenticated/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/index.tsx`.

- The loader is the only place an href is built: `ensureDomainFromParam` (or
  `ensureDefaultDomain` for global objects) → `build*Href` from `@app/queries/…` (throw if it
  returns nothing) → `queryClient.ensureQueryData(…)` → return the href(s).
- `pendingComponent` is `DetailRoutePending` labelled `Loading <object>`, no ellipsis;
  `errorComponent` is `DetailRouteError`. The page uses `useSuspense*DetailQuery` and has no
  loading or not-found guards.
- `component` is a `*DetailRoute.tsx` adapter next to the page: it reads loader data and path
  params with `getRouteApi("<exact route id>")` and passes them as props.

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
      no href, `ensureQueryData`, and return the href(s).
- [ ] `DetailRoutePending` with `Loading <object>` (no ellipsis) and `DetailRouteError`.
- [ ] Adapters read through `getRouteApi` with the exact route id and pass props.
- [ ] Pages read no path params (except `useSelectedDomain`) and read search only for their own
      route via `getRouteApi`.
- [ ] `validateSearch` has typed fallbacks; internal links are typed.
