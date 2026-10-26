# Pulp UI

A web console for [Pulp](https://pulpproject.org/) — the open source platform for managing
repositories of software packages (RPM, Python, container images, Ansible content, files, and
more) and serving them to consumers.

Pulp is API-first, and Pulp UI puts a modern, [PatternFly](https://www.patternfly.org/)-based
interface on top of that API so you can manage your content from the browser instead of the
command line.

**With Pulp UI you can:**

- Define **remotes** (upstream sources) and **sync** them into **repositories**.
- Inspect repository versions and the **content** inside them.
- Create **publications** and expose them through **distributions**.
- Follow **tasks**, manage **domains**, and administer **users, groups, and roles**.

## Quick Start

```bash
npm ci
PULP_API_URL="http://localhost:8080" PULP_API_ROOT="/pulp" npm run start:dev
```

- `PULP_API_URL` — where your Pulp backend is running.
- `PULP_API_ROOT` — Pulp's `API_ROOT` (the default for a stock pulpcore install is `/pulp`).

Then open <http://localhost:3000>. With the default `AUTH=basic`, sign in through the browser
login form. The Pulp domain defaults to `"default"` and is switched from within the app.

Need a local Pulp backend to point at? See [CONTRIBUTING.md](CONTRIBUTING.md).

## Environment variables

The essentials to get started:

| Variable        | Default | Purpose                                         |
| --------------- | ------- | ----------------------------------------------- |
| `PULP_API_URL`  | —       | Base URL of the Pulp server to connect to       |
| `PULP_API_ROOT` | `/pulp` | Pulp's `API_ROOT`; must match the server config |
| `AUTH`          | `basic` | Authentication mode: `none`, `basic`, or `oidc` |

See the [full environment variables reference](website/docs/configuration/environment.md) for
OIDC, deployment, branding, and testing options.

## Project Structure

npm workspaces:

| Workspace | Contents                    |
| --------- | --------------------------- |
| `common/` | Env config + branding       |
| `client/` | React / Vite SPA            |
| `server/` | Express production server   |
| `e2e/`    | Playwright end-to-end tests |

## Tech Stack

React 19, TypeScript, PatternFly 6, and TanStack Query & Router.

See the [full tech stack](docs/tech-stack.md) for the complete list.

## Scripts

| Command             | Description                               |
| ------------------- | ----------------------------------------- |
| `npm run start:dev` | Run the app for local development         |
| `npm run build`     | Build all workspaces                      |
| `npm run lint`      | Type check + lint                         |
| `npm run format`    | Format check                              |
| `npm run test`      | Unit tests (Vitest)                       |
| `npm run test:e2e`  | Playwright (needs Pulp; see CONTRIBUTING) |
| `npm run generate`  | Regenerate the OpenAPI client             |

See the [full scripts reference](docs/scripts.md) for every available script.

Developer docs and architecture decision records: [docs/](docs/README.md).
