#!/bin/sh
set -eu

SERVER_URL="${SERVER_URL:-http://pulp-ui-2-keycloak:8080}"
USERNAME="${KEYCLOAK_ADMIN:-admin}"
PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
MASTER_REALM="master"
PULP_REALM="${KEYCLOAK_REALM:-pulp}"
UI_CLIENT_ID="${KEYCLOAK_UI_CLIENT_ID:-frontend}"
DEV_USER="${KEYCLOAK_DEV_USER:-admin}"
DEV_PASSWORD="${KEYCLOAK_DEV_PASSWORD:-password}"

kcadm() {
  /opt/keycloak/bin/kcadm.sh "$@"
}

# Login to master realm admin
kcadm config credentials \
  --server "${SERVER_URL}" \
  --user "${USERNAME}" \
  --password "${PASSWORD}" \
  --realm "${MASTER_REALM}"

# Create realm (idempotent)
if kcadm get "realms/${PULP_REALM}" >/dev/null 2>&1; then
  echo "Realm ${PULP_REALM} already exists"
else
  kcadm create realms -s "realm=${PULP_REALM}" -s enabled=true
fi

# Public SPA client for pulp-ui-2
if kcadm get clients -r "${PULP_REALM}" --fields clientId --format csv --noquotes \
  | grep -qx "${UI_CLIENT_ID}"; then
  echo "Client ${UI_CLIENT_ID} already exists"
else
  kcadm create clients -r "${PULP_REALM}" -f - <<EOF
{
  "clientId": "${UI_CLIENT_ID}",
  "publicClient": true,
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": true,
  "webOrigins": ["*"],
  "redirectUris": [
    "http://localhost:3000/*",
    "http://localhost:8080/*",
    "*"
  ],
  "defaultClientScopes": [
    "acr",
    "basic",
    "email",
    "profile",
    "roles"
  ],
  "optionalClientScopes": [
    "address",
    "microprofile-jwt",
    "offline_access",
    "phone"
  ]
}
EOF
fi

# Audience mapper so UI access tokens carry aud=<frontend>. The gateway validates
# aud against its client_id, but Keycloak public-client tokens omit it by default.
# Mirrors step 8 of Pulp's official keycloak auth guide.
UI_CLIENT_UUID="$(
  kcadm get clients -r "${PULP_REALM}" -q "clientId=${UI_CLIENT_ID}" \
    --fields id --format csv --noquotes | head -n1
)"
if kcadm get "clients/${UI_CLIENT_UUID}/protocol-mappers/models" -r "${PULP_REALM}" \
  --fields name --format csv --noquotes | grep -qx "audience-${UI_CLIENT_ID}"; then
  echo "Audience mapper for ${UI_CLIENT_ID} already exists"
else
  kcadm create "clients/${UI_CLIENT_UUID}/protocol-mappers/models" -r "${PULP_REALM}" -f - <<EOF
{
  "name": "audience-${UI_CLIENT_ID}",
  "protocol": "openid-connect",
  "protocolMapper": "oidc-audience-mapper",
  "config": {
    "included.client.audience": "${UI_CLIENT_ID}",
    "id.token.claim": "false",
    "access.token.claim": "true"
  }
}
EOF
fi

# Dev user
if kcadm get users -r "${PULP_REALM}" -q "username=${DEV_USER}" --fields username --format csv --noquotes \
  | grep -qx "${DEV_USER}"; then
  echo "User ${DEV_USER} already exists"
else
  kcadm create users -r "${PULP_REALM}" \
    -s "username=${DEV_USER}" \
    -s enabled=true \
    -s emailVerified=true \
    -s firstName=admin \
    -s lastName=admin \
    -s email=admin@example.com
fi

kcadm set-password -r "${PULP_REALM}" --username "${DEV_USER}" --new-password "${DEV_PASSWORD}"

echo "Keycloak realm ${PULP_REALM} initialized"
