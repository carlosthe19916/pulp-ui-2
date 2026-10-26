# Environment variables

Developer-only environment variables. User-facing runtime/deployment variables (and `BRANDING`)
are documented in the user-facing site:
[website/docs/configuration/environment.md](../website/docs/configuration/environment.md) and
[website/docs/configuration/branding.md](../website/docs/configuration/branding.md).

## Build-time

| Variable   | Default      | Purpose                                                     |
| ---------- | ------------ | ----------------------------------------------------------- |
| `VERSION`  | `99.0.0`     | UI version string shown in the About dialog (via `_env`).   |
| `NODE_ENV` | `production` | Build/runtime mode: `development`, `production`, or `test`. |

## Development & end-to-end testing

Used only while developing or running the test suites — never in production.

| Variable       | Default    | Purpose                                                                                           |
| -------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `COVERAGE`     | unset      | `true` → instrument the client build with Istanbul for coverage.                                  |
| `E2E_AUTH`     | `basic`    | Auth mode the Playwright suite exercises (`none`, `basic`, `oidc`); passed to the app under test. |
| `E2E_USERNAME` | `admin`    | Username the Playwright suite logs in with.                                                       |
| `E2E_PASSWORD` | `password` | Password the Playwright suite logs in with.                                                       |
| `CI`           | unset      | When set, Playwright forbids `.only`, retries once, uses 2 workers, and never reuses a server.    |
