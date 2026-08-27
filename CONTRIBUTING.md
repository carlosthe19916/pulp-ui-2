# Contributing to pulp-ui-2

## Prerequisites

- Node.js 22+
- npm 10+
- Docker (for e2e Pulp via `docker-compose.e2e.yml`)

## Getting started

```bash
npm ci
PULP_API_URL="http://localhost:8080" npm run start:dev
```

The app starts at `http://localhost:3000`

### Local Pulp for UI / e2e

```bash
docker compose -f docker-compose.e2e.yml up -d

# Wait until status is OK (first boot can take several minutes)
curl -fsS http://localhost:8080/api/pulp/api/v3/status/

# Default admin password used by e2e (override with E2E_PASSWORD)
docker compose -f docker-compose.e2e.yml exec -T pulp \
  pulpcore-manager reset-admin-password --password password
```

Compose mounts `e2e/pulp/settings/settings.py` (API root + domains). Default credentials: `admin` / `password` (`E2E_USERNAME` / `E2E_PASSWORD`).

## Project structure

```
pulp-ui-2/
  common/          # Shared ESM library (env config, branding)
  client/          # React SPA (Vite + PatternFly 6 + TanStack Router/Query/Table)
  server/          # Express proxy server
  e2e/             # Playwright E2E tests
  docs/            # Contributor notes (a11y/perf tracking, …)
```

## Adding a plugin descriptor

Descriptors let the UI render new Pulp plugin types without new routes or pages. To add support for a new plugin (e.g., `rpm`):

1. Create descriptor files under `client/src/app/descriptors/rpm/`:
   - One file per resource kind: `rpm-repository.ts`, `rpm-remote.ts`, etc.
   - Each exports a `ResourceDescriptor` with `pulpType`, `kind`, `label`, field definitions, and `isAvailable` check.

2. Register them in `client/src/app/descriptors/index.ts`:

   ```ts
   import { rpmRepositoryDescriptor } from "./rpm/rpm-repository";
   registerDescriptor(rpmRepositoryDescriptor);
   ```

3. Create typed query hooks under `client/src/app/queries/rpm-*.ts` for CRUD mutations.

The generic list/detail shells will automatically pick up the new descriptors.

## Running tests

```bash
# Unit tests
npm test

# Unit tests (single run, CI mode)
npm test -- --run

# E2E — start Pulp compose first (see above), then:
npm run test:e2e

# E2E with UI
npm run test -w e2e -- --ui
```

Playwright starts `npm run start:dev` via `webServer` and passes `PULP_API_URL`. Authenticated specs reuse a saved storage state from `e2e/tests/auth.setup.ts`.

## Linting and formatting

```bash
npm run lint        # ESLint
npm run format      # Prettier check
npm run lint:fix    # ESLint auto-fix
npm run format:fix  # Prettier auto-fix
```

Commit hooks (husky + lint-staged) run lint and format on staged files automatically.

## Container image

Production image build follows the trustify-ui shape (UBI Node builder + minimal runner, `npm run dist`, `entrypoint.sh`). Requires `PULP_API_URL` at runtime:

```bash
docker build -t pulp-ui:local .
docker run --rm -p 8080:8080 -e PULP_API_URL=http://host.docker.internal:8080 pulp-ui:local
```

## Commit conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commit messages are validated by commitlint.

```
feat: add rpm repository descriptor
fix: handle empty response in task detail
docs: update contributing guide
```

## Architecture

- Living overview: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Full ADR / roadmap: [plan.md](plan.md)
- A11y / perf backlog: [docs/A11Y_PERF.md](docs/A11Y_PERF.md)
