# Contributing to pulp-ui-2

## Prerequisites

- Node.js 22+
- npm 10+
- Podman (+ `podman-compose`) for the local oci-env Pulp backend; see below

## Getting started

```bash
npm ci
PULP_API_URL="http://localhost:5003" npm run start:dev
```

The app starts at `http://localhost:3000`

### Local Pulp for UI / e2e

The UI and the e2e suite run against an **oci-env** Pulp on `http://localhost:5003`, configured by
[`compose.env`](compose.env). It installs every catalog plugin from source, pinned to the versions
in [`plugin-versions.txt`](plugin-versions.txt): the same backend the e2e CI job runs.

```bash
npm run backend:setup   # once, and after plugin-versions.txt changes
npm run backend:start   # http://localhost:5003, admin / password
npm run backend:stop
```

Good to know:

- The backend repos live in the gitignored `.backend/` folder, so checkouts you develop plugins in
  are never touched. `backend:setup` force-resets every clone there to its pinned ref.
- To try the UI with a few plugins instead of all, run `npm run backend:plugins -- rpm container`
  (`-- all` to go back). **Each switch wipes the backend's data**; re-run `npm run seed` after it.
- The stack runs as its own compose project, `pulp_ui_2_pinned`, but still needs port 5003: stop
  any other backend on it first.

All backend scripts are listed in [docs/scripts.md](docs/scripts.md#local-pulp-backend). With an
AI agent, the `dev-env-setup` skill walks through first-time setup and the `e2e-local` skill runs
the suite.

## Project structure

```
pulp-ui-2/
  common/          # Shared ESM library (env config, branding)
  client/          # React SPA (Vite + PatternFly 6 + TanStack Router/Query/Table)
  server/          # Express proxy server
  e2e/             # Playwright E2E tests
  docs/            # Developer docs and architecture decision records
```

## Running tests

```bash
# Unit tests
npm test

# Unit tests (single run, CI mode)
npm test -- --run

# E2E against the oci-env backend on :5003 (start it first, see above)
npm run test:local -w e2e

# E2E with UI
npm run test:local -w e2e -- --ui
```

Playwright starts `npm run start:dev` via `webServer` and passes `PULP_API_URL`. Authenticated specs reuse a saved storage state from `e2e/tests/auth.setup.ts`.

## Linting and formatting

```bash
npm run lint        # ESLint
npm run format      # Prettier check
npm run lint:fix    # ESLint auto-fix
npm run format:fix  # Prettier auto-fix

# Fast inner loop, mostly for coding agents (CI still runs the commands above)
npm run lint:fast        # oxlint (subset of the ESLint rules)
npm run format:fast:fix  # oxfmt (close to Prettier; follow with format:fix)
npm run oxlint:sync      # regenerate .oxlintrc.json after editing eslint.config.mjs
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

- How the code works: [docs/internals/](docs/internals/)
- Design decisions: [docs/adr/](docs/adr/)
