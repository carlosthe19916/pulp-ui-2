# AGENTS.md

Repository-specific guidance for AI coding agents working in the **Pulp UI** repository (`@pulp-ui`).

## Repository Architecture

Four npm workspaces (`@app` alias maps to `client/src/app/`):

```
├── common/                   # shared ESM module (branding, env config)
│                             #   built with Rollup → ESM (.mjs) + CJS (.cjs)
├── client/                   # React SPA (Vite, TypeScript, PatternFly)
│   └── src/                  #   dev server: port 3000 with proxy to backend
│       ├── main.tsx          # app entry point
│       ├── router.ts         # TanStack Router instance
│       ├── routes/           # file-based routes (TanStack Router)
│       ├── routeTree.gen.ts  # auto-generated route tree (DO NOT EDIT)
│       ├── catalog/          # `@catalog`: per-plugin data (pulp_type → endpoints, form fields)
│       └── app/
│           ├── App.tsx       # root app component
│           ├── pages/        # page components, grouped by area
│           ├── queries/      # TanStack Query hooks, one file per domain
│           ├── components/   # shared UI components
│           ├── hooks/        # custom hooks (useBranding, useStorage)
│           ├── context/      # React context providers
│           ├── layout/       # app shell / layout components
│           ├── utils/        # shared utilities
│           ├── client/       # auto-generated API client (DO NOT EDIT)
│           ├── axios-config/ # Axios instance and interceptors
│           └── oidc.ts       # OIDC configuration
├── server/                   # Express.js production server (proxying, env injection)
└── e2e/                      # Playwright end-to-end tests
    └── tests/
        ├── *.spec.ts         # one spec per area (remotes, repositories, content, users, …)
        ├── auth.setup.ts     # authentication setup project
        ├── fixtures.ts       # shared Playwright fixtures
        ├── pom/              # page objects
        └── helpers/          # shared test helpers
```

## Key Commands

```bash
# Install dependencies (always after clone or pulling dependency updates)
npm ci

# Development server (builds common, runs client on :3000)
npm run start:dev

# Type check and lint
npm run lint

# Auto-fix lint and format
npm run lint:fix
npm run format:fix

# Unit tests (Vitest)
npm test

# E2E tests (Playwright) — from the e2e workspace
npm run test:e2e         # run all e2e specs (root; delegates to -w e2e)
npm test -w e2e          # same, run directly in the e2e workspace
npm run test:ui -w e2e   # Playwright UI mode

# Regenerate OpenAPI client from spec
npm run generate

# Production builds
npm run build
```

## Tech Stack

- **Language**: [TypeScript](https://www.typescriptlang.org/docs/)
- **UI framework**: [React](https://react.dev/learn)
- **Component library**: [PatternFly](https://www.patternfly.org/) (`@patternfly/react-core`, `@patternfly/react-table`)
- **Build**: [Vite](https://vite.dev/guide/) (client), [Rollup](https://rollupjs.org/) (common, server)
- **Routing**: [TanStack Router](https://tanstack.com/router/latest) (file-based, code-split routes)
- **Data fetching**: [TanStack React Query](https://tanstack.com/query/latest)
- **Tables**: [PatternFly Data view](https://www.patternfly.org/extensions/data-view/overview) (`@patternfly/react-data-view`)
- **HTTP client**: [Axios](https://axios-http.com/)
- **API client codegen**: [@hey-api/openapi-ts](https://heyapi.dev/)
- **Forms**: [react-hook-form](https://react-hook-form.com/) + [yup](https://github.com/jquense/yup)
- **Auth**: [react-oidc-context](https://github.com/authts/react-oidc-context) + [oidc-client-ts](https://github.com/authts/oidc-client-ts) (modes: `none` / `basic` / `oidc`)
- **Unit testing**: [Vitest](https://vitest.dev/)
- **E2E testing**: [Playwright](https://playwright.dev/)
- **Linting**: [ESLint](https://eslint.org/)
- **Formatting**: [Prettier](https://prettier.io/)
- **Package manager**: [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces)

### PatternFly & UI Patterns

- **Use PatternFly components** for all UI.
- **Tables**: Use `@patternfly/react-data-view` with the shared helpers in `@app/components/DataView`. `UserList` is the reference. Pagination, sorting and filtering are server-side.
- **Detail pages** use tab-based layouts. Tab content components **must not** include their own `<PageSection>` wrapper.
- **Forms**: Use `react-hook-form` + `yup` validation.
- **Empty states**: Use PatternFly `EmptyState` components.

## Coding Standards

Conventions not enforced by ESLint — follow these when adding new code.

### React Context

Model every context on `client/src/app/context`:

- **Context object** — `<Name>Context`, created with `createContext<I<Name>Context | null>(null)`.
- **Provider component** — `<Name>Provider` (`React.FC<{ children: React.ReactNode }>`).

**File layout** — one folder per context, PascalCase file names:

```
context/<Name>/
  <Name>Context.tsx    # createContext call + <Name>ContextValue type
  <Name>Provider.tsx   # <Name>Provider component
```

Keep the `createContext` call and the provider in separate files so provider-only edits don't invalidate the context module (and to keep `react-refresh` happy).

### Client structure patterns (`client/src/app/`)

Placement is by **scope**, not type. **Only two layers exist:**

- **Shared by >1 page → app root** (`@app/components/…`).
- **Used by exactly one page → that page's matching sub-directory** (relative
  `./components/X`).

An **area** dir (`pages/<area>/`) is grouping only — never put `components/`,
`hooks/`, etc. there. Anything shared across pages, even within one area, is
shared and goes to the app root; "area-shared" is not a scope. A page's main
component(s) stay at the page root; page-local helpers go in same-named
sub-dirs beside them.

```
client/src/app/
  components/  hooks/  context/  utils/   # shared, app-root layers
  pages/
    content-management/                   # area — NO sub-dirs of its own
      repositories/                       # entity — groups its pages
        repository-list/                  # page
          RepositoryList.tsx              # main component (page root)
          components/                     # used only by this page
            RepositoryModal.tsx
          hooks/
            useRepositoryForm.ts
        repository-detail/                # page
          RepositoryDetail.tsx
          RepositoryDetailRoute.tsx       # route → component adapter (page root)
          components/
      content/
        content-list/  content-detail/  …
```

`PluginContentPanel` is used by both the content detail page and the repository
version page (via `VersionContent`) → shared, so it lives in `@app/components/`,
not under `pages/content-management/`.

### API endpoints

Before wiring any REST call, check the OpenAPI spec at `client/openapi/pulp.json`
(the source of truth) for the endpoint's query params, request body, and response
shape. It's ~4 MB — grep it by path/`operationId`. The generated
`client/src/app/client/` mirrors it and is often faster: `sdk.gen.ts` for the
endpoint function itself (URL, method, params) and `types.gen.ts` for its
param/response types (e.g. `UsersListData["query"]` lists every supported query
param). Prefer server-side
`limit`/`offset`/`ordering`/filters over fetching everything and processing in memory.

### PatternFly CSS class names

Never hardcode PatternFly class strings (`pf-v6-c-*`, `pf-m-*`, `pf-u-*`,
`pf-l-*`). Import the typed constants from `@patternfly/react-styles` (a direct
dependency) so a typo fails `tsc` instead of silently breaking layout. Combine
several with the `css()` helper.

```tsx
import { css } from "@patternfly/react-styles";
import checkStyles from "@patternfly/react-styles/css/components/Check/check";
import tableStyles from "@patternfly/react-styles/css/components/Table/table";

<Td className={tableStyles.tableCheck}>
  <div className={css(checkStyles.check, checkStyles.modifiers.standalone)} />
</Td>;
```

### Import rules

- **Import Order**: Group imports alphabetically and follow the order below,
  with each block separated by a blank line:
  1. **React/Router block**: Dependencies from `react`, `react-*`
  2. **Package dependencies block**: Any dependency declared in
     `package.json` (e.g., `axios`, `dayjs`, `yup`, `lodash`, etc.)
  3. **PatternFly block**: Any `@patternfly/*` dependency
  4. **App imports block**: Any `@app/*` dependency
  5. **Relative imports block**: Local relative imports (`./`, `../`, etc.)

### TanStack Query

- **Never `throw` inside a `queryFn`.** A `queryFn` returns data; error states
  must originate from the HTTP layer — a rejected Axios request propagates
  naturally and carries the status/shape the app's error handling expects. A
  manual `throw new Error(...)` instead triggers React Query's retry/backoff on a
  condition that will never recover, and yields a non-`AxiosError` the error
  boundaries and notifications can't interpret.
- For a non-HTTP "not found" / empty-result case (e.g. an aggregate endpoint that
  answers `200` with an empty list), **return a falsy sentinel** (`""` / `null` —
  match the field's `enabled: !!value` convention) and handle it where the throw
  belongs: the route **`loader`** (throw there → `errorComponent` renders) or the
  consuming component. See `buildContentHref` in
  `client/src/app/queries/content.ts` (returns `null` for a `pulp_type` with no
  `apiPath`), which the content detail route `loader` throws on → `DetailRouteError`
  (`routes/_authenticated/content-management/$pulpDomain/content/$contentType/$contentId/index.tsx`).

### Hrefs, ids and query keys

- **Queries take hrefs, never ids.** Every `*QueryOptions` and `use*Query` hook
  takes the resource's (or, for a nested list, its parent's) `pulp_href`. Nested
  collections are read as `${toProxyHref(parentHref)}child/` (e.g. a repository's
  `versions/`, a group's `users/`).
- **Only routes turn ids into hrefs.** A detail route has only the URL's ids, so its
  `loader` builds the href once with the family's `build*Href(…)`
  (`buildRepositoryHref`, `buildRemoteHref`, `buildContentHref`, `buildGroupHref`,
  `buildTaskHref`, …), primes the query, and **returns `{ href }`**. The page's
  `*DetailRoute.tsx` adapter reads it with `routeApi.useLoaderData()` and passes
  `href` down; entry hooks are `useSuspense<Family>DetailQuery({ href })`.
- **`build*Href` returns the server form** (`pulpHref()` → `{API_ROOT}…`), the exact
  string the API returns as `pulp_href`. That keeps key factories pure
  (`<name>Keys.detail(href)` just appends the href): a rebuilt href and a response
  href hit the same cache slot, so invalidations match without normalizing. Never
  build a key from `pulpApiPath()` (that's a request URL, `/api/pulp/…`); requests
  go through `toProxyHref(href)`.
- **Sub-resources nest under their parent's `detail(href)`** in the key factory
  (`repositoryKeys.versions(href)`, `groupKeys.users(href)`), so invalidating the
  parent's detail refreshes them too — e.g. a settled sync task invalidates
  `repositoryKeys.detail(href)` (detail page + versions).

### Content query file layout

Content families split their query modules along a **plugin axis**. Keep the two
sides distinct — don't let plugin specifics leak into the neutral base, and don't
duplicate generic reads in the plugin file.

- **`queries/<family>.ts`** (e.g. `distributions.ts`) is **plugin-neutral**. It
  owns the cross-type list over the un-typed aggregate collection
  (`pulpApiPath("<family>/", domain)`), the `*QueryKey` constant and the `*Keys`
  factory (`*Keys.all()` is the family's root key). It also owns per-item
  actions **and sub-resources that are uniform across plugins** — e.g. repository
  `sync` (`useRepositorySyncMutation`) and `versions`
  (`useRepositoryVersionsListQuery`): one hook serves every plugin. Sub-resource
  **reads** take the parent's href (see "Hrefs, ids and query keys"); **actions**
  like sync and create rebuild the endpoint client-side from parts
  (`pulpApiPath(`repositories/${apiPath}/${id}/<action>/`, domain)`, with
  `apiPath` from the catalog). A sub-resource counts as uniform when its response type is generic and its query
  params are identical across plugins (the per-plugin generated type differs only
  in a `path` param, which `ListParams` drops). Per-plugin body/field shape is
  modelled in the catalog (`form.createFields`, `compatibleRemoteTypes`, …), not by
  separate hooks. Create takes the catalog `apiPath` and update/delete take the
  `href`, with a `Record<string, unknown>` body, so one hook serves every plugin.
- **`queries/<plugin>-<family>.ts`** (none exist yet; content upload will likely be
  the first) holds **only plugin-specific** queries: sub-resources that genuinely
  vary by plugin, or a typed list when the aggregate returns a union type. Reuse the
  base's `*Keys` factory for keys and invalidation so cache slots stay unified.
- **Typed detail-by-href is NOT plugin-specific** — it's a generic GET on
  `toProxyHref(href)`. It lives in the **base family file** as that family's own
  `<family>DetailQueryOptions` + `use<Family>DetailQuery` /
  `useSuspense<Family>DetailQuery` (e.g. `contentDetailQueryOptions` /
  `useContentDetailQuery` in `queries/content.ts`; `repositoryDetailQueryOptions` /
  `useSuspenseRepositoryDetailQuery` in `queries/repositories.ts`), keyed on the
  family's `<name>Keys.detail(href)` so the slot is unified. Generic over the
  response type — each caller passes the concrete generated type
  (`useContentDetailQuery<FileFileContentResponse>`), never a union. Do **not** add a
  `<plugin><Family>DetailQueryOptions` to the plugin file.

## Development

### `npm run start:dev` (development mode)

Builds `common` once, then concurrently watches `common` (rollup rebuild on change) and runs the Vite dev server on port 3000 with HMR.

The **`server/` workspace is not started** in dev mode — Vite handles both static serving and API proxying directly:

| Path   | Proxied to     | Default                 |
| ------ | -------------- | ----------------------- |
| `/api` | `PULP_API_URL` | `http://localhost:8080` |

The `/api` proxy rewrites `/api/pulp` to Pulp's `API_ROOT` (`PULP_API_ROOT`, default `/pulp`) via `rewritePulpApiPath`, and forwards session cookies (`cookieDomainRewrite: ""`). Basic Auth is **not** injected at the proxy — session/cookie auth handles it.

Environment variables and branding are injected into `index.html` via `ViteEjsPlugin` at startup.

### `npm run start` (production mode)

Builds `common` and `client`, then starts the Express server from `server/` on port 8080.

The Express server (`server/src/index.ts`):

- Serves `client/dist/` as static files
- Renders `index.html.ejs` per-request via EJS, injecting runtime env vars

Use this mode only if you want to see how you app behaves with minified JS, CSS, etc. resources, just like when it will be deployed in production.

## Testing

### Unit Tests (Vitest)

- Run with `npm test`
- Test files colocated with source code (`.test.ts`, `.test.tsx`)
- Config in `client/vite.config.ts` (test block)
- Mock API calls and use React Testing Library for component tests

### E2E Tests (Playwright)

- Plain Playwright `.spec.ts` files in `e2e/tests/`, one per area (`remotes`, `repositories`, `publications`, `distributions`, `content`, `domains`, `users`, `groups`, `roles`, `task-status`, …).
- `auth.setup.ts` is a setup project that authenticates once; shared logic lives in `e2e/tests/helpers/`, `fixtures.ts` and the page objects in `pom/`.
- Run from the `e2e` workspace (`npm test -w e2e`) or via the root `npm run test:e2e`.

## Branding

Branding (logo, application name, URLs) is selected at **build time** via the `BRANDING` environment variable and baked into the output. There is no runtime branding switch.

**Default branding directory** (`./branding`):

```
branding/
  strings.json          # primary branding config
  manifest.json         # PWA web app manifest
  favicon.ico           # browser tab icon
  images/
    pulp_logo_icon.svg  # masthead header logo
    pulp_logo.png       # full-size logo
```

**`strings.json` structure:**

```json
{
  "application": {
    "title": "Pulp",
    "name": "Pulp UI",
    "description": "UI application for Pulp"
  },
  "about": {
    "displayName": "Pulp UI",
    "imageSrc": "<%= brandingRoot %>/images/pulp_logo_icon.svg",
    "documentationUrl": ""
  },
  "masthead": {
    "leftBrand": {
      "src": "<%= brandingRoot %>/images/pulp_logo_icon.svg",
      "alt": "Pulp UI",
      "height": "25px"
    },
    "leftTitle": { "text": "Pulp UI" },
    "rightBrand": null,
    "supportUrl": "https://github.com/pulp/pulp-ui-2/issues"
  }
}
```

Image paths must use `<%= brandingRoot %>` — this is resolved to `branding` at build time via EJS.

**Creating a custom-branded build:**

1. Create a directory (e.g., `branding-custom/`) with the same structure as `branding/`.
2. Customize `strings.json` and replace image assets.
3. Build with: `BRANDING=./branding-custom npm run build`

**What branding controls:** tab title, HTML meta tags, masthead logo/text, About modal, Get Started section, support URL, favicon, and PWA manifest.

**What branding does not control:** colors/theme (PatternFly), layout, routes, or behavior.
