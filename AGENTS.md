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
│       └── app/
│           ├── App.tsx       # root app component
│           ├── pages/        # page components, grouped by area
│           ├── queries/      # TanStack Query hooks, one file per domain
│           ├── components/   # shared UI components
│           ├── hooks/        # custom hooks (useBranding, useStorage)
│           ├── context/      # React context providers
│           ├── layout/       # app shell / layout components
│           ├── descriptors/  # domain metadata/descriptors
│           ├── utils/        # shared utilities
│           ├── client/       # auto-generated API client (DO NOT EDIT)
│           ├── axios-config/ # Axios instance and interceptors
│           └── oidc.ts       # OIDC configuration
├── server/                   # Express.js production server (proxying, env injection)
└── e2e/                      # Playwright end-to-end tests
    └── tests/
        ├── *.spec.ts         # test specs (browse, admin, login, repositories, tasks)
        ├── auth.setup.ts     # authentication setup project
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
- **Tables**: [TanStack Table](https://tanstack.com/table/latest)
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
- **Tables**: Use [TanStack Table](https://tanstack.com/table/latest) (`@tanstack/react-table`) for pagination/sorting/filtering, rendered with PatternFly table components.
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

> Some existing contexts under `context/` (e.g. `notifications-context.ts`, `plugin-context.ts`) predate this standard and use flat kebab-case files. Use the `Auth/` layout above for **new** contexts.

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

- Plain Playwright `.spec.ts` files in `e2e/tests/`, one per area (`browse`, `admin`, `login`, `repositories`, `tasks`).
- `auth.setup.ts` is a setup project that authenticates once; shared logic lives in `e2e/tests/helpers/`.
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
