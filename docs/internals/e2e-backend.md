# E2E backend

How the Pulp backend that the Playwright e2e suite runs against is provisioned, and why it is built
from source with oci-env.

## The backend

Both CI and local dev run the **oci-env** Pulp on port 5003, configured by
[`compose.env`](../../compose.env). Its `DEV_SOURCE_PATH` installs every plugin the UI catalog knows
about **from source**, including `pulp_npm` and `pulp_hugging_face`, so e2e exercises the whole
catalog. Locally, set it up with the `dev-env-setup` skill and run the suite with the `e2e-local`
skill (`npm run test:local -w e2e`).

## Why from source (not the stock image)

CI previously booted the all-in-one `pulp/pulp:stable` image, which omits some plugins (e.g.
`pulp_npm`, `pulp_hugging_face`). That meant CI and local dev tested different plugin sets, and
plugin-specific specs for the omitted plugins could not run. Building the same oci-env backend
developers use gives CI exact plugin parity with local dev. The trade-off is a slower, heavier CI
(plugins build from source); it is mitigated by publishing the base image (see below).

## Image vs plugins — what is where

The oci-env image (`localhost/oci_env/pulp:base`) bakes **only** the OS and Python deps from
oci_env's `base/` dir (on top of the upstream `pulp-ci-centos10` base) plus a few extra dev libs
for `pulp_ostree`. **No Pulp plugins live in the image.** Every plugin — including `pulpcore` —
is installed _editable_ from the `/src` mount at **container startup** (`install_local_deps` in
oci_env's `utils.sh`), pinned by the refs cloned from `plugin-versions.txt`.

Two consequences shape the CI design:

- The image content is a function of the **oci_env `base/` tree** (plus the extra dev libs), **not**
  of `plugin-versions.txt`. So a plugin version bump reuses the same image.
- Any job that **boots** Pulp must still have all plugin repos cloned into `/src`; a job that only
  **builds** the image needs only `oci_env`. The `pulp-oci-env` action's `clone-plugins` input
  toggles this.

## How CI builds it

1. Clone the backend repos as siblings of the checkout, pinned to the refs in
   [`plugin-versions.txt`](../../plugin-versions.txt). That file is the record of which backend
   versions CI clones; its plugin rows must match `DEV_SOURCE_PATH` in `compose.env` (the workflow
   fails if they diverge).
2. Install oci-env and derive a CI env file from `compose.env` (drop the local-only
   keycloak/signing profiles, force docker compose, toggle domains per matrix leg) — so
   `DEV_SOURCE_PATH` stays single-sourced.
3. A `build-backend` job publishes the base image to
   `ghcr.io/<repo>/pulp-backend`, tagged by a hash of the oci_env `base/` tree (+ the extra dev
   libs + the `BACKEND_RECIPE` knob). If that tag already exists it skips the build; otherwise it
   builds from source and pushes. The e2e matrix pulls the image, clones the pinned plugin repos
   into `/src`, and `compose up` installs the plugins at startup. Fork PRs (no registry push) fall
   back to a one-run artifact, and any pull/download miss falls back to building the base from
   source.

The shared clone/install/env-file steps live in the composite action
`.github/actions/pulp-oci-env/`.

## Changing plugin versions

`plugin-versions.txt` pins each plugin to a **release tag** (never `main`) so a given file content
= one reproducible backend. The `plugin-versions-update.yaml` workflow bumps these to the latest
release daily and opens an auto-merging PR that the e2e suite gates. To change versions by hand,
edit the file directly; `oci_env` tracks `main` and is bumped manually (it publishes no releases).
