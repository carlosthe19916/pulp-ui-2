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
