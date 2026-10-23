# AGENTS.md

Repository-specific guidance for AI coding agents working in the **Pulp UI** repository (`@pulp-ui`).

## How intent is recorded

Three layers, each with one job. Don't restate one layer's rules in another; link to them.

| Layer                                  | Answers                                                                                | Use it                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [docs/adr/](docs/adr/)                 | **What** the UI does and why (code-free)                                               | Before changing a screen or flow, match ADRs by `description` and follow their `## Rules` |
| [evals/](evals/)                       | **How** code must be written; specs with `implements:` turn ADR rules into code checks | Read the specs whose `globs` match the files you touch; `/eval` checks them               |
| [docs/development/](docs/development/) | How the code works (catalog, data flow, API quirks)                                    | Orientation; it explains, it doesn't set rules                                            |

`/eval` runs automatically: a Stop hook (`.claude/hooks/eval-gate.sh`) keeps a session that
edited `client/src/` from ending until `/eval` has run since its last edit. A design change
needs a new or superseding ADR, and the evals that `implements:` it updated in the same change.

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

`npm run lint` is the real type check (ESLint + `tsc -p tsconfig.app.json` per workspace); a
bare `tsc --noEmit` at the root checks nothing.

## Tech Stack

TypeScript, React, [PatternFly](https://www.patternfly.org/) (components,
[Data view](https://www.patternfly.org/extensions/data-view/overview) tables), Vite (client) and
Rollup (common, server), TanStack Router (file-based, code-split) and TanStack Query, Axios,
[@hey-api/openapi-ts](https://heyapi.dev/) (generated client), react-hook-form + yup,
react-oidc-context (auth modes `none` / `basic` / `oidc`), Vitest, Playwright, ESLint, Prettier,
npm workspaces.

## Coding Standards

Summaries only; the linked eval holds the full rule, examples and checklist.

- **Placement by scope** ([evals/placement.md](evals/placement.md)): shared by more than one
  page → app root (`@app/components`, `@app/hooks`, …); used by one page → that page's
  sub-directory. Area directories under `pages/` only group pages.
- **Contexts** ([evals/placement.md](evals/placement.md)): `context/<Name>/<Name>Context.tsx` +
  `<Name>Provider.tsx`.
- **PatternFly** ([evals/ui-conventions.md](evals/ui-conventions.md)): PatternFly components for
  all UI; tables with `@patternfly/react-data-view` + `@app/components/DataView` (`UserList` is
  the reference), server-side paging/sorting/filtering; detail pages use tabs and tab content
  has no `<PageSection>`; typed class constants from `@patternfly/react-styles`, never `pf-*`
  strings ([evals/placement.md](evals/placement.md)).
- **Imports** ([evals/placement.md](evals/placement.md)): React → packages → `@patternfly/*` →
  `@app/*` → relative, blank line between blocks.
- **Catalog** ([evals/catalog.md](evals/catalog.md)): `@catalog` is data only; per-type UI goes
  in `pulp_type`-keyed registries; pages read capabilities from the catalog.
- **Queries** ([evals/queries.md](evals/queries.md)): one inline object arg; queries take hrefs
  and only route loaders build them; no `throw` in a `queryFn`; neutral vs plugin query files.
- **Mutations and toasts** ([evals/toastr.md](evals/toastr.md)): hooks own invalidation, pages
  own toasts via hook-level callbacks; `mutate` over `mutateAsync`.
- **Forms** ([evals/forms.md](evals/forms.md)): react-hook-form + yup; submission errors shown
  in-form; close on success only.
- **Signatures** ([evals/signatures.md](evals/signatures.md)): a named-object parameter for 2+
  arguments.

### API endpoints

Before wiring any REST call, check the OpenAPI spec at `client/openapi/pulp.json` (the source of
truth; ~4 MB, grep it by path or `operationId`). The generated `client/src/app/client/` mirrors it
and is often faster: `sdk.gen.ts` for the endpoint (URL, method, params), `types.gen.ts` for its
types (e.g. `UsersListData["query"]` lists every query param). Known API quirks:
[docs/development/pulp-api-notes.md](docs/development/pulp-api-notes.md).

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

Branding (logo, names, URLs) is chosen at **build time** with `BRANDING=<dir>` (default
`./branding`) and baked into the output. Format and steps:
[website/docs/configuration/branding.md](website/docs/configuration/branding.md).
