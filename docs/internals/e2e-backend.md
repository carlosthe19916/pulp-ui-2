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
(plugins build from source); it is mitigated by caching the built image (see below).

## How CI builds it

1. Clone the backend repos as siblings of the checkout, pinned to the refs in
   [`plugin-versions.txt`](../../plugin-versions.txt). That file is the record of which backend
   versions CI clones; its plugin rows must match `DEV_SOURCE_PATH` in `compose.env` (the workflow
   fails if they diverge).
2. Install oci-env and derive a CI env file from `compose.env` (drop the local-only
   keycloak/signing profiles, force docker compose, toggle domains per matrix leg) — so
   `DEV_SOURCE_PATH` stays single-sourced.
3. A `build-backend` job builds the image once and caches it, keyed on
   `plugin-versions.txt` + `compose.env`; the test matrix loads the cached image instead of each
   leg rebuilding from source.

The shared clone/install/env-file steps live in the composite action
`.github/actions/pulp-oci-env/`. To change which plugin versions CI tests, edit
`plugin-versions.txt` (pin to release tags for reproducible runs, or `main` for latest).
