# AGENTS.md

Repository-specific guidance for AI coding agents working in the **Pulp UI** repository (`@pulp-ui`).

## Where guidance lives

| Layer                              | Answers                                    | Use it                                                                                    |
| ---------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| [docs/adr/](docs/adr/)             | **What** the UI does and why (code-free)   | Before changing a screen or flow, match ADRs by `description` and follow their `## Rules` |
| [.rulesync/](.rulesync/)           | **How** code is written: rules and skills  | Loaded automatically by your tool; see [Coding Standards](#coding-standards)              |
| [docs/internals/](docs/internals/) | How the code works (data flow, API quirks) | Orientation; it explains, it doesn't set rules                                            |

A design change needs a new or superseding ADR, and the rules that cover it updated in the same
change.

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
│           ├── hooks/        # custom hooks (useStorage, useSelectedDomain)
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

# Type check and lint (the gate: ESLint + tsc), format check (Prettier)
npm run lint
npm run format

# Auto-fix lint and format
npm run lint:fix
npm run format:fix

# Fast inner loop (oxlint, oxfmt); see "Linting and formatting for agents"
npm run lint:fast
npm run lint:fast:fix
npm run format:fast
npm run format:fast:fix

# Regenerate .oxlintrc.json after changing eslint.config.mjs
npm run oxlint:sync

# Unit tests (Vitest)
npm test

# E2E tests (Playwright) — from the e2e workspace
npm run test:e2e         # run all e2e specs (root; delegates to -w e2e)
npm test -w e2e          # same, run directly in the e2e workspace
npm run test:ui -w e2e   # Playwright UI mode

# Regenerate OpenAPI client from spec
npm run generate

# Regenerate .claude/ and .cursor/ rules and skills from .rulesync/
npm run rules

# Production builds
npm run build
```

Claude Code loads project guidance via `CLAUDE.md` (symlink to `AGENTS.md` in this repo).

`npm run lint` is the real type check (ESLint + `tsc -p tsconfig.app.json` per workspace); a
bare `tsc --noEmit` at the root checks nothing.

### Linting and formatting for agents

Agents use the fast oxc tools (`lint:fast`, `format:fast`) while working, for speed (about 4 s
compared with about 30 s for ESLint), and run the full ESLint and Prettier gate once at the end.

- While iterating: `npm run lint:fast` (oxlint) and `npm run format:fast:fix` (oxfmt).
- Before finishing: `npm run format:fix && npm run lint && npm run format`.
  ESLint, tsc and Prettier are the gate (CI, pre-commit); oxlint misses some
  ESLint rules and oxfmt differs slightly from Prettier.
- After changing `eslint.config.mjs`, run `npm run oxlint:sync`; after changing
  `.prettierrc.mjs`, update `.oxfmtrc.json`.

## Tech Stack

TypeScript, React, [PatternFly](https://www.patternfly.org/) (components,
[Data view](https://www.patternfly.org/extensions/data-view/overview) tables), Vite (client) and
Rollup (common, server), TanStack Router (file-based, code-split) and TanStack Query, Axios,
[@hey-api/openapi-ts](https://heyapi.dev/) (generated client), react-hook-form + yup,
react-oidc-context (auth modes `none` / `basic` / `oidc`), Vitest, Playwright, ESLint, Prettier,
npm workspaces.

## Coding Standards

Rules and skills are written once in `.rulesync/rules/` and `.rulesync/skills/`;
`npm run rules` ([rulesync](https://github.com/dyoshikawa/rulesync)) generates the
`.claude/` and `.cursor/` copies each tool discovers. Never edit the generated copies: change
the source and run `npm run rules` (`npm run lint` fails while they are stale). When you rename
or remove a rule or skill, delete its generated copies by hand.

Before finishing a change, check it against the `## Checklist` of every rule matching the
changed files. In Claude Code, `/eval` does this.

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
- Runs in Vitest Browser Mode (locally your installed Google Chrome, Playwright Chromium in CI)
  with `vitest-browser-react`

### E2E Tests (Playwright)

- Plain Playwright `.spec.ts` files in `e2e/tests/`, one per area (`remotes`, `repositories`, `publications`, `distributions`, `content`, `domains`, `users`, `groups`, `roles`, `task-status`, …).
- `auth.setup.ts` is a setup project that authenticates once; shared logic lives in `e2e/tests/helpers/`, `fixtures.ts` and the page objects in `pom/`.
- Run from the `e2e` workspace (`npm test -w e2e`) or via the root `npm run test:e2e`.

## Branding

Branding (logo, names, URLs) is chosen at **build time** with `BRANDING=<dir>` (default
`./branding`) and baked into the output. Format and steps:
[website/docs/configuration/branding.md](website/docs/configuration/branding.md).
