# Pulp UI

React admin + browse UI for Pulp (pulpcore + plugins).

## Quick Start

```bash
npm ci
PULP_API_URL="http://localhost:24817" npm run start:dev
```

Open http://localhost:3000 and sign in with your Pulp credentials. The Vite proxy forwards `/api` to `PULP_API_URL` and uses **session cookies** after login (no injected Basic Auth).

## Project Structure

npm workspaces monorepo:

- `common/` — shared env + branding
- `client/` — React SPA (Vite)
- `server/` — Express production server
- `e2e/` — Playwright placeholder (Phase 5)

## Tech Stack

- React 19 + TypeScript
- Vite + Vitest
- PatternFly 6
- TanStack Query, Router, Table
- ESLint + Prettier
- OpenAPI client via `@hey-api/openapi-ts`

## Scripts

- `npm run start:dev` — build common + start Vite client
- `npm run build` — build all workspaces
- `npm run lint` / `npm run format` — lint and format checks
- `npm run test` — unit tests
- `npm run coverage -w client` — Vitest coverage
- `npm run generate` — regenerate OpenAPI client
