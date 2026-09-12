# keycloak

Starts a Keycloak dev server, an authenticating gateway (oauth2-proxy) in front of Pulp, and
configures Pulp to trust the gateway for local OIDC development with pulp-ui-2.

## Usage

From the pulp-ui-2 checkout (with `OCI_ENV_PATH` set):

```bash
oci-env -e compose.env compose build
oci-env -e compose.env compose up
```

| Service            | URL                                           |
| ------------------ | --------------------------------------------- |
| Pulp API (direct)  | http://localhost:5003/api/pulp/api/v3/status/ |
| Pulp API (gateway) | http://localhost:5010/api/pulp/api/v3/status/ |
| Keycloak admin     | http://localhost:8090 (admin / admin)         |

## How authentication works

In `AUTH=oidc`, the UI logs into Keycloak itself (public client `frontend`) and sends the access
token as `Authorization: Bearer <JWT>`. Pulp ships no Bearer-token authentication class, so the UI
points at the **gateway** (`:5010`), not Pulp directly. The gateway (oauth2-proxy):

1. validates the Bearer JWT against the Keycloak realm keys, then
2. injects a trusted `X-Forwarded-Preferred-Username` header and forwards to Pulp.

Pulp trusts that header via pulpcore's shipped `PulpRemoteUserAuthentication` + `RemoteUserBackend`.
This is Pulp's official external/reverse-proxy auth pattern (see pulpcore
`docs/admin/guides/auth/external.md`); Pulp never validates the JWT itself.

> The auth wiring lives in `pulp_config.env` as `PULP_`-prefixed env vars
> (`PULP_REST_FRAMEWORK__DEFAULT_AUTHENTICATION_CLASSES`, `PULP_AUTHENTICATION_BACKENDS`,
> `PULP_REMOTE_USER_ENVIRON_NAME`), **not** in a settings file. The pulp container's s6 services
> hardcode `PULP_SETTINGS=/etc/pulp/settings.py`, so a profile-generated settings file is never
> loaded by the api/content/worker processes — but dynaconf reads `PULP_` env vars in every process.

> Caveat: oci-env always publishes Pulp on `:5003` too, so Pulp stays directly reachable on the host,
> bypassing the gateway. This is a known dev-only limitation — only the gateway port enforces auth.

## pulp-ui-2 UI (OIDC)

Run the UI separately with:

```bash
AUTH=oidc \
OIDC_SERVER_URL=http://localhost:8090/realms/pulp \
OIDC_CLIENT_ID=frontend \
PULP_API_URL=http://localhost:5010 \
PULP_API_ROOT=/api/pulp \
npm run start:dev
```

Open http://localhost:3000 and sign in via Keycloak (`admin` / `password`).

## Variables

See `profile_default_config.env` for defaults (`KEYCLOAK_PORT=8090`, `KEYCLOAK_GATEWAY_PORT=5010`,
realm `pulp`, client `frontend`).
