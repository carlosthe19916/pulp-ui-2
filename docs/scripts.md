# npm scripts

All scripts are defined in the root `package.json` and most fan out to the workspaces
(`common`, `client`, `server`, `e2e`) with `--if-present`. Run them from the repository root
unless noted otherwise.

## Develop

| Script                     | What it does                                                          |
| -------------------------- | --------------------------------------------------------------------- |
| `npm run start:dev`        | Build `common`, then watch `common` and run the client for local dev. |
| `npm run start:dev:common` | Watch and rebuild the `common` workspace only.                        |
| `npm run start:dev:client` | Run the client dev server only.                                       |
| `npm run start:dev:server` | Run the Express server in watch mode only.                            |
| `npm run start`            | Build `common` + `client`, then start the production Express server.  |

### Seed data

`npm run seed` fills a Pulp backend with data for manual testing: for every installed plugin a
remote, a repository synced from it (mostly from <https://fixtures.pulpproject.org/>), a
publication where the plugin publishes and a distribution. It also creates content guards, an
alternate content source, a failed sync task, users, a group, a custom role with role
assignments, and a second domain. Every object is named `seed-…`; re-running only adds what's
missing.

| Option          | What it does                                               |
| --------------- | ---------------------------------------------------------- |
| `-- --reset`    | Delete every `seed-…` object first, then seed again.       |
| `-- --no-sync`  | Create the objects without syncing content from upstreams. |
| `-- --only a,b` | Seed only these plugins (and `extras` for the rest).       |

It targets `PULP_API_URL` (default `http://localhost:5003`, the oci-env backend) and
`PULP_API_ROOT` (default `/api/pulp/`), as `PULP_USERNAME` / `PULP_PASSWORD` (default
`admin` / `password`). Seeded users sign in with `seed-password-123`.

## Build

| Script              | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `npm run build`     | Build every workspace.                                  |
| `npm run dist`      | Assemble a distributable `dist/` from the built output. |
| `npm run clean`     | Remove build output (`dist/`).                          |
| `npm run clean:all` | Remove build output and `node_modules`.                 |

## Lint & format

| Script                    | What it does                                           |
| ------------------------- | ------------------------------------------------------ |
| `npm run lint`            | The gate: ESLint + `tsc` type check across workspaces. |
| `npm run lint:fix`        | Auto-fix ESLint issues.                                |
| `npm run lint:fast`       | Fast lint with oxlint (for the inner dev loop).        |
| `npm run lint:fast:fix`   | Auto-fix with oxlint.                                  |
| `npm run format`          | The gate: Prettier format check.                       |
| `npm run format:fix`      | Format with Prettier.                                  |
| `npm run format:fast`     | Fast format check with oxfmt.                          |
| `npm run format:fast:fix` | Format with oxfmt.                                     |

## Test

| Script                       | What it does                                                       |
| ---------------------------- | ------------------------------------------------------------------ |
| `npm run test`               | Unit tests (Vitest) across `common`, `client`, and `server`.       |
| `npm run coverage -w client` | Unit tests with coverage (client workspace).                       |
| `npm run test:e2e`           | Playwright end-to-end tests (needs a running Pulp backend).        |
| `npm run test:e2e:local`     | Playwright against a local backend (defaults to `localhost:5003`). |

## Code generation

| Script                | What it does                                                      |
| --------------------- | ----------------------------------------------------------------- |
| `npm run generate`    | Regenerate the OpenAPI client from the Pulp API spec.             |
| `npm run rules`       | Regenerate the `.claude/` and `.cursor/` rules from `.rulesync/`. |
| `npm run rules:check` | Verify the generated rules are up to date (part of `lint`).       |
| `npm run oxlint:sync` | Regenerate `.oxlintrc.json` after changing `eslint.config.mjs`.   |
