---
name: dev-env-setup
description: Use when a developer asks about onboarding, getting started, setup, or bootstrapping their pulp-ui-2 development environment. Guides them through installing tools, cloning the Pulp backend repos, installing oci-env and building the backend images. Does not start the backend or the UI.
---

# pulp-ui-2 Developer Setup

Walk the developer through setup ONE STEP AT A TIME. Do not summarize all steps upfront. Do not
present a checklist. Complete each step, show the result, then move to the next. Ask before
proceeding when indicated. Run every command from the repository root.

## Step 1 — Check the layout

oci-env mounts the parent directory as `/src` and resolves `COMPOSE_PROFILE=pulp-ui-2/...` by
folder name, so this repo must be a folder named `pulp-ui-2` and every backend repo must be its
sibling.

If the folder is not named `pulp-ui-2`: STOP HERE and ask the user to rename or re-clone it.

## Step 2 — Check prerequisites

Check `git`, `node` (22+), `npm`, `python3`, `pip3`, `podman` and `podman-compose` (1.2+). Report
what is missing.

Do not run privileged installation commands (`sudo dnf`, `brew`) for the user. Point them at
their platform package manager (nvm for Node) and wait for them to confirm.

## Step 3 — Clone the backend repos

oci-env installs every entry of `DEV_SOURCE_PATH` in `compose.env` from source and fails to start
if one is missing. Read that list from `compose.env`; do not hardcode it. Add `oci_env` and
`pulp-openapi-generator` to it.

List which of them already exist as `../<repo>`. If all exist: say so and move to step 4.

Otherwise, show the missing ones and ask before cloning each one from upstream:

    git clone https://github.com/pulp/<repo>.git ../<repo>

To match the versions CI builds against, clone the ref pinned for each repo in
`plugin-versions.txt` (`git clone --branch <ref> ...`); that file is the record of which backend
versions we clone, and its plugin rows must stay in sync with `DEV_SOURCE_PATH`.

Never re-clone, pull, or touch a checkout that already exists.

## Step 4 — Install oci-env

If `oci-env` is not on `PATH`:

    pip3 install --user -e ../oci_env/client

Check that `OCI_ENV_PATH` points at `../oci_env` (absolute path). If it does not, ask the user to
add `export OCI_ENV_PATH=<absolute path>/oci_env` to their shell rc file and open a new shell.
Wait for them to confirm.

## Step 5 — Install UI dependencies

    npm ci

The `prepare` script also generates the API client and installs the husky commit hooks.

## Step 6 — Build the backend images

Ask before running it, because the first build takes several minutes:

    oci-env -e compose.env compose build

This only builds images. Do not run `compose up`.

## Step 7 — Orient the developer

Give a brief tour:

- `compose.env` (backend: plugins, profiles, port 5003) and `.env` (UI: `AUTH`,
  `PULP_API_URL`). Their auth settings must match; see `profiles/keycloak/README.md`.
- Start the backend and run e2e with the `e2e-local` skill; start the UI with
  `npm run start:dev` (http://localhost:3000, `admin` / `password`).
- AGENTS.md for repo structure, coding rules and commands.
