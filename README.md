# Pulp UI

React admin + browse UI for Pulp (pulpcore + plugins).

## Quick Start

```bash
npm ci
PULP_API_URL="http://localhost:8080" npm run start:dev
```

Open http://localhost:3000 and sign in via the browser login form when `AUTH=basic` (HTTP Basic Auth with credentials stored in browser storage; no auth env vars beyond `AUTH`). Vite proxies
`/api` to `PULP_API_URL`. Pulp domain is the client constant `PULP_DOMAIN` in `client/src/app/Constants.ts` (default
`"default"`), not an env var.

Local Pulp setup: [CONTRIBUTING.md](CONTRIBUTING.md).

## Environment variables

Typed app env: `common/src/environment.ts` (`PulpEnvType` / `PULP_ENV`). Also used by Vite, Express, `entrypoint.sh`,
Playwright, and CI.

| Variable                     | Default                                  | Purpose                                                                                         |
| ---------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `PULP_API_URL`               | `http://localhost:8080` (proxy fallback) | Upstream Pulp for `/api` proxy. Required in Docker/`entrypoint.sh`; recommended for `start:dev` |
| `AUTH`                       | none, basic, oidc                        | Enable/Disable authentication                                                                   |
| `OIDC_CLIENT_ID`             | frontend                                 | Set OIDC client                                                                                 |
| `OIDC_SERVER_URL`            | `http://localhost:8090/realms/pulp`      | Set OIDC Server URL                                                                             |
| `OIDC_SCOPE`                 | openid                                   | Set OIDC Scope                                                                                  |
| `PORT`                       | `8080`                                   | Express listen port                                                                             |
| `NODE_ENV`                   | `production`                             | `development` \| `production` \| `test`                                                         |
| `VERSION`                    | `99.0.0`                                 | UI version (About dialog via `_env`)                                                            |
| `UI_INGRESS_PROXY_BODY_SIZE` | `500m`                                   | Upload body size limit                                                                          |
| `BRANDING`                   | `./branding`                             | Branding assets path (server-only)                                                              |
| `BASE_URL`                   | `/`                                      | SPA public base path (e.g. GH Pages)                                                            |
| `COVERAGE`                   | unset                                    | `true` → Istanbul client instrumentation                                                        |
| `DEBUG`                      | unset (`1` in Docker image)              | `1` → log `PULP_ENV` + verbose proxy                                                            |
| `NODE_EXTRA_CA_CERTS`        | unset                                    | TLS CA bundle; entrypoint may append cluster CAs                                                |
| `E2E_USERNAME`               | `admin`                                  | Playwright login user                                                                           |
| `E2E_PASSWORD`               | `password`                               | Playwright login password                                                                       |
| `CI`                         | unset                                    | Playwright: forbid `.only`, retry once, 1 worker, no server reuse                               |

`PORT`, `PULP_API_URL`, and `BRANDING` are server-only (`SERVER_ENV_KEYS`) and stripped from browser `_env`. E2e/CI pass
`PULP_API_URL` into `start:dev`; see `.github/workflows/ci-e2e.yaml`.

## Project Structure

npm workspaces: `common/` (env + branding), `client/` (React/Vite SPA), `server/` (Express), `e2e/` (Playwright).

Stack: React 19, TypeScript, Vite/Vitest, PatternFly 6, TanStack Query/Router/Table, Playwright, OpenAPI via
`@hey-api/openapi-ts`.

Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Scripts

- `npm run start:dev` — build common + Vite client
- `npm run build` — all workspaces
- `npm run lint` / `npm run format` — checks
- `npm run test` — unit tests
- `npm run test:e2e` — Playwright (needs Pulp; see CONTRIBUTING)
- `npm run coverage -w client` — Vitest coverage
- `npm run generate` — regenerate OpenAPI client

## Accessibility & performance

Deferred a11y/perf work: [docs/A11Y_PERF.md](docs/A11Y_PERF.md).
