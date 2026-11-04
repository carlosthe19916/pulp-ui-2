---
title: Running Pulp UI
description: Deploy and configure the Pulp UI itself — how the app is served, its development and production modes, and how to connect it to a Pulp server.
sidebar_label: Deployment
sidebar_position: 1
---

# Running Pulp UI

This section is for operators who deploy and configure the Pulp UI itself — distinct from
[Using Pulp](../using-pulp/index.md) (end users) and [Administration](../administration/index.md)
(managing content, identity and the Pulp installation).

## Install

To install and connect Pulp UI to a Pulp server, follow
[Getting started → Installation](../getting-started/installation.md).

## How it's served

Pulp UI is a static single-page app plus a small Node server, like any built React app behind an
Express host.

| Mode        | Command             | What runs                                                                        |
| ----------- | ------------------- | -------------------------------------------------------------------------------- |
| Development | `npm run start:dev` | Vite dev server on port 3000 with hot reload and an `/api` proxy to the backend. |
| Production  | `npm run start`     | Express server on port 8080 serving the built client from `client/dist/`.        |

In production the Express server renders `index.html` per request and injects the runtime
[environment variables](./environment.md) into the page, so one build can be pointed at different
Pulp servers without rebuilding. [Branding](./branding.md) is the exception — it is baked in at
**build** time.

## Configure

- [Environment variables](./environment.md) — the full configuration reference (API URL, auth mode, …).
- [Authentication](./authentication.md) — `basic`, `oidc`, or `none`.
- [Branding](./branding.md) — logo, names and URLs, chosen at build time.

## Behind a reverse proxy

Terminate TLS at your proxy (nginx, HAProxy, an ingress) and forward to the Pulp UI server. The one
requirement is that the browser can reach the Pulp API at the URL you set in
[`PULP_API_URL`](./environment.md) — either the same origin or one that allows the UI's requests.
