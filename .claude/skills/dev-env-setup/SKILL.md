---
name: dev-env-setup
description: >-
  Use when a developer asks about onboarding, getting started, setup, or
  bootstrapping their pulp-ui-2 development environment. Guides them through
  installing tools, cloning the pinned Pulp backend repos into .backend/,
  installing oci-env and building the backend images. Does not start the backend
  or the UI.
---

# pulp-ui-2 Developer Setup

Walk the developer through setup ONE STEP AT A TIME. Do not summarize all steps upfront. Do not
present a checklist. Complete each step, show the result, then move to the next. Ask before
proceeding when indicated. Run every command from the repository root.

## Step 1 — Check prerequisites

Check `git`, `node` (22+), `npm`, `python3` (with `venv`), `podman` and `podman-compose` (1.2+).
Report what is missing.

Do not run privileged installation commands (`sudo dnf`, `brew`) for the user. Point them at
their platform package manager (nvm for Node) and wait for them to confirm.

## Step 2 — Clone the backend repos and install oci-env

    npm run backend:setup

It clones every repo in `plugin-versions.txt` into the gitignored `.backend/` folder, pinned to
its ref, and installs the oci-env CLI there; no global `oci-env` or `OCI_ENV_PATH` is needed.

- It is safe to re-run, but it force-resets every `.backend/` clone, discarding local edits there.
  It never touches the developer's other checkouts.
- If it reports that `plugin-versions.txt` and `DEV_SOURCE_PATH` differ, show the diff and stop:
  the two files must be fixed together.

## Step 3 — Install UI dependencies

    npm ci

The `prepare` script also generates the API client and installs the husky commit hooks.

## Step 4 — Build the backend images

Ask before running it, because the first build takes several minutes:

    npm run backend -- compose build

This only builds images. Do not start the backend.

## Step 5 — Orient the developer

Give a brief tour:

- `compose.env` (backend: plugins, profiles, port 5003) and `.env` (UI: `AUTH`,
  `PULP_API_URL`). Their auth settings must match; see `profiles/keycloak/README.md`.
- `npm run backend:start` / `backend:stop` run the backend; `npm run backend:plugins` narrows the
  installed plugins (switching wipes its data). The full list is in `docs/scripts.md`.
- `npm run start:dev` starts the UI on http://localhost:3000 (`admin` / `password`); the
  `e2e-local` skill runs the e2e suite.
- AGENTS.md for repo structure, coding rules and commands.
