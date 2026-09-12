# keycloak

Starts a Keycloak dev server and configures Pulp social-auth for local OIDC development with pulp-ui-2.

## Usage

From the pulp-ui-2 checkout (with `OCI_ENV_PATH` set):

```bash
oci-env -e compose.env compose build
oci-env -e compose.env compose up
```

| Service             | URL                                           |
| ------------------- | --------------------------------------------- |
| Pulp API            | http://localhost:5003/api/pulp/api/v3/status/ |
| Keycloak admin      | http://localhost:8090 (admin / admin)         |
| Pulp Keycloak login | http://localhost:5003/api/pulp/login/keycloak |

## pulp-ui-2 UI (OIDC)

Run the UI separately with:

```bash
AUTH=oidc \
OIDC_SERVER_URL=http://localhost:8090/realms/pulp \
OIDC_CLIENT_ID=frontend \
PULP_API_URL=http://localhost:5003 \
PULP_API_ROOT=/api/pulp \
npm run start:dev
```

Open http://localhost:3000 and sign in via Keycloak (`admin` / `password`).

## Phase 1 limitation

`compose.env` keeps `PULP_REST_FRAMEWORK__DEFAULT_PERMISSION_CLASSES=AllowAny` so the API remains open for local dev. The UI sends Bearer tokens, but Pulp does not enforce them until JSON header auth (or similar) is added.

## Variables

See `profile_default_config.env` for defaults (`KEYCLOAK_PORT=8090`, realm `pulp`, clients `frontend` and `pulp`).
