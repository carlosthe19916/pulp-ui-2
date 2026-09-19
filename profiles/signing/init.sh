#!/bin/bash
# oci-env profile init script: create a dev GPG key and register a generic
# core:AsciiArmoredDetachedSigningService so a signing service exists in the API/UI.
#
# oci-env runs this inside the pulp container, as root, after pulpcore-api is up. It runs on
# every container start, so every step is idempotent. Pattern from oci_env/profiles/galaxy_base.
#
# Keyring lives on the persistent, pulp-owned /var/lib/pulp volume. init.sh runs as root but
# the signing script runs as the pulp user, so we generate the key straight into a pulp-owned
# home and chown it -- avoiding the /root/.gnupg copy dance galaxy_base needs.
set -euo pipefail

SIGNING_SERVICE_NAME="${SIGNING_SERVICE_NAME:-pulp-ui-dev-signing}"
GPG_EMAIL="${GPG_EMAIL:-pulp@example.com}"
GNUPGHOME=/var/lib/pulp/.gnupg
SIGN_SCRIPT=/src/pulp-ui-2/profiles/signing/sign_metadata.sh
export GNUPGHOME

echo "[signing] setting up signing service '${SIGNING_SERVICE_NAME}'"

mkdir -m 700 -p "${GNUPGHOME}"

# Generate a passphrase-less dev key if one for this email does not already exist.
if gpg --list-keys "${GPG_EMAIL}" >/dev/null 2>&1; then
  echo "[signing] GPG key for ${GPG_EMAIL} already exists"
else
  echo "[signing] generating GPG key for ${GPG_EMAIL}"
  gpg --batch --gen-key <<EOF
%echo Generating pulp-ui dev signing key
Key-Type: default
Key-Length: 4096
Subkey-Type: default
Subkey-Length: default
Name-Real: Pulp UI Dev Signing
Name-Comment: dev only, no passphrase
Name-Email: ${GPG_EMAIL}
Expire-Date: 0
%no-ask-passphrase
%no-protection
%commit
%echo done
EOF
fi

# Primary-key fingerprint (first fpr: line).
KEY_FPR="$(gpg --with-colons --fingerprint "${GPG_EMAIL}" | awk -F: '/^fpr:/{print $10; exit}')"
echo "[signing] key fingerprint: ${KEY_FPR}"

# The signing script runs as the pulp user, so the keyring must be pulp-owned.
chown -R pulp:pulp "${GNUPGHOME}"

# Register the signing service only if it is not already present (idempotent).
if pulpcore-manager shell -c \
  "import sys; from pulpcore.app.models import SigningService; sys.exit(0 if SigningService.objects.filter(name='${SIGNING_SERVICE_NAME}').exists() else 1)"; then
  echo "[signing] signing service '${SIGNING_SERVICE_NAME}' already exists"
else
  echo "[signing] registering signing service '${SIGNING_SERVICE_NAME}'"
  pulpcore-manager add-signing-service "${SIGNING_SERVICE_NAME}" \
    "${SIGN_SCRIPT}" "${KEY_FPR}" \
    --home "${GNUPGHOME}"
  echo "[signing] signing service '${SIGNING_SERVICE_NAME}' created"
fi
