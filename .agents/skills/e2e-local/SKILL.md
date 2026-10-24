---
name: e2e-local
description: Run the Playwright e2e suite locally against the oci-env Pulp backend defined by compose.env (API on localhost:5003). Reuses a running backend and starts it with oci-env only if it is down. Use when asked to run or debug e2e tests, a single spec, or "test against local pulp".
allowed-tools: Bash(curl:*) Bash(oci-env:*) Bash(npm:*) Bash(npx:*)
---

# E2E against the local oci-env backend

The backend is the oci-env Pulp configured by [`compose.env`](../../../compose.env): API on
`http://localhost:5003`, API root `/api/pulp/`, domains enabled, admin `admin` / `password`
(the same defaults as `E2E_USERNAME` / `E2E_PASSWORD` in `e2e/tests/helpers/auth.ts`).

Run every command from the repository root.

## 1. Check the backend — reuse it if it is up

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:5003/api/pulp/api/v3/status/
```

`200` → the backend is running: **reuse it** and go to step 3. Never restart, rebuild, or
`compose down` a running backend.

## 2. Start it only if it is down

Requires `oci-env` on `PATH` and `OCI_ENV_PATH` pointing at the `oci_env` checkout.

```bash
oci-env -e compose.env compose up -d
# images missing? build first:
# oci-env -e compose.env compose build
```

Poll the status endpoint until it answers `200` (first boot installs every `DEV_SOURCE_PATH`
plugin from source and can take several minutes):

```bash
for i in $(seq 1 120); do
  curl -fsS -o /dev/null http://localhost:5003/api/pulp/api/v3/status/ && echo ready && break
  sleep 5
done
```

Still not ready after ~10 minutes → show `oci-env -e compose.env compose logs --tail=100` and stop.

The admin user is created from `DJANGO_SUPERUSER_*`. If the setup project fails to log in:

```bash
oci-env -e compose.env pulpcore-manager reset-admin-password --password password
```

## 3. Run the tests

`test:local` targets `http://localhost:5003` and uses `e2e/playwright.local.ts` (`AUTH=basic`).

```bash
npm run test:local -w e2e                              # whole suite
npm run test:local -w e2e -- tests/remotes.spec.ts     # one spec
npm run test:local -w e2e -- -g "creates a remote"     # by test title
npm run test:local -w e2e -- --headed                  # visible browser
npm run test:local -w e2e -- --ui                      # Playwright UI mode
```

The full suite is long: run it in the background. Report passed / failed counts and the name
and error of each failing test.

## Gotchas

- **Dev server reuse**: `playwright.local.ts` reuses anything already listening on `:3000`. Make
  sure it is the dev server pointed at `:5003` with `AUTH=basic` (the repo `.env` sets both);
  otherwise stop it and let Playwright start `npm run start:dev`.
- **Chrome channel**: `playwright.local.ts` uses `channel: "chrome"`. If Chrome is missing, run
  `npx playwright install chrome` from `e2e/`.
- **Credentials**: override with `E2E_USERNAME` / `E2E_PASSWORD`.
- **OIDC (keycloak profile)**: `playwright.local.ts` hardcodes `AUTH=basic`, so use the default
  config through the gateway on `:5010`:
  `PULP_API_URL=http://localhost:5010 E2E_AUTH=oidc OIDC_SERVER_URL=http://localhost:8090/realms/pulp OIDC_CLIENT_ID=frontend npm test -w e2e`
  (see `profiles/keycloak/README.md`).
- **Results**: HTML report in `e2e/playwright-report/` (`npx playwright show-report` from
  `e2e/`), traces and screenshots in `e2e/test-results/`.
- **Afterwards**: leave the backend running.
