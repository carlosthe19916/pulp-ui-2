---
title: Environment variables
sidebar_position: 1
---

# Environment variables

Pulp UI is configured through environment variables passed to the container.

| Variable                     | Default                             | Description                                                                                |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `PULP_API_URL`               | — (required)                        | Base URL of the Pulp server. Requests under `/api` are proxied to it.                      |
| `PULP_API_ROOT`              | `/pulp`                             | Pulp's `API_ROOT`. Must match the server configuration.                                    |
| `AUTH`                       | `basic`                             | Authentication mode: `none`, `basic` or `oidc`. See [Authentication](./authentication.md). |
| `OIDC_CLIENT_ID`             | `frontend`                          | OpenID Connect client ID (when `AUTH=oidc`).                                               |
| `OIDC_SERVER_URL`            | `http://localhost:8090/realms/pulp` | OpenID Connect issuer URL (when `AUTH=oidc`).                                              |
| `OIDC_SCOPE`                 | `openid`                            | Scopes requested from the identity provider (when `AUTH=oidc`).                            |
| `PORT`                       | `8080`                              | Port the server listens on.                                                                |
| `BASE_URL`                   | `/`                                 | Public base path when serving Pulp UI under a sub-path.                                    |
| `UI_INGRESS_PROXY_BODY_SIZE` | `500m`                              | Maximum request body size, for example for uploads.                                        |
| `NODE_EXTRA_CA_CERTS`        | unset                               | Path to an extra CA bundle used when connecting to Pulp over TLS.                          |
| `DEBUG`                      | `1` in the container image          | Set to `1` for verbose logging of the configuration and proxy.                             |

`PULP_API_URL`, `PULP_API_ROOT` and `PORT` are used by the server only and are never exposed to the browser.
