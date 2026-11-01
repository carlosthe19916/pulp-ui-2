# Tech stack

Pulp UI is a TypeScript monorepo of four npm workspaces (`common`, `client`, `server`, `e2e`).
The main pieces, by area:

## UI

| Technology                                | Version | Role                                |
| ----------------------------------------- | ------- | ----------------------------------- |
| [React](https://react.dev/)               | 19      | UI library                          |
| [PatternFly](https://www.patternfly.org/) | 6       | Component library and design system |
| PatternFly Data view                      | 6       | Data tables and list views          |
| [dayjs](https://day.js.org/)              | 1       | Date formatting                     |

## Data & routing

| Technology                                                                              | Role                                   |
| --------------------------------------------------------------------------------------- | -------------------------------------- |
| [TanStack Query](https://tanstack.com/query)                                            | Server-state caching and data fetching |
| [Zustand](https://zustand.docs.pmnd.rs/)                                                | Client state that outlives a page      |
| [TanStack Router](https://tanstack.com/router)                                          | File-based, code-split routing         |
| [Axios](https://axios-http.com/)                                                        | HTTP client                            |
| [react-hook-form](https://react-hook-form.com/) + [yup](https://github.com/jquense/yup) | Forms and their validation             |
| [zod](https://zod.dev/)                                                                 | URL and storage state validation       |
| [react-oidc-context](https://github.com/authts/react-oidc-context) + oidc-client-ts     | OIDC authentication                    |

## Build tooling

| Technology                                    | Role                                       |
| --------------------------------------------- | ------------------------------------------ |
| [TypeScript](https://www.typescriptlang.org/) | Language                                   |
| [Vite](https://vite.dev/)                     | Client dev server and bundler              |
| [Rollup](https://rollupjs.org/)               | Builds for `common` and `server`           |
| [Express](https://expressjs.com/)             | Production server (static serving + proxy) |

## Code generation

| Technology                                         | Role                                           |
| -------------------------------------------------- | ---------------------------------------------- |
| [@hey-api/openapi-ts](https://heyapi.dev/)         | Generates the typed API client from OpenAPI    |
| [rulesync](https://github.com/dyoshikawa/rulesync) | Generates agent rules/skills from `.rulesync/` |

## Testing

| Technology                            | Role                      |
| ------------------------------------- | ------------------------- |
| [Vitest](https://vitest.dev/)         | Unit tests (browser mode) |
| [Playwright](https://playwright.dev/) | End-to-end tests          |

## Lint & format

| Technology                                                            | Role                                    |
| --------------------------------------------------------------------- | --------------------------------------- |
| [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)      | The gate (CI, pre-commit)               |
| [oxlint](https://oxc.rs/) + oxfmt                                     | Fast lint/format for the inner dev loop |
| [Husky](https://typicode.github.io/husky/) + lint-staged + commitlint | Git hooks and commit linting            |
