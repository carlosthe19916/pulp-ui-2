# Pulp UI

React admin + browse UI for Pulp (pulpcore + plugins).

## Quick Start

```bash
npm ci
PULP_API_URL="http://localhost:8080" PULP_DOMAIN="default" npm run start:dev
```

Open http://localhost:3000 and sign in with your Pulp credentials. The Vite proxy forwards `/api` to `PULP_API_URL` and uses **session cookies** after login (no injected Basic Auth).

For a local Pulp matching this UI’s API root (`/api/pulp/` + domains), see [CONTRIBUTING.md](CONTRIBUTING.md).

## Project Structure

npm workspaces monorepo:

- `common/` — shared env + branding
- `client/` — React SPA (Vite)
- `server/` — Express production server
- `e2e/` — Playwright end-to-end tests

## Tech Stack

- React 19 + TypeScript
- Vite + Vitest
- PatternFly 6
- TanStack Query, Router, Table
- ESLint + Prettier
- OpenAPI client via `@hey-api/openapi-ts`
- Playwright (e2e)

## Scripts

- `npm run start:dev` — build common + start Vite client
- `npm run build` — build all workspaces
- `npm run lint` / `npm run format` — lint and format checks
- `npm run test` — unit tests
- `npm run test:e2e` — Playwright e2e (expects Pulp; see CONTRIBUTING)
- `npm run coverage -w client` — Vitest coverage
- `npm run generate` — regenerate OpenAPI client

## Accessibility & performance

Known/deferred a11y and perf work is tracked in [docs/A11Y_PERF.md](docs/A11Y_PERF.md).
