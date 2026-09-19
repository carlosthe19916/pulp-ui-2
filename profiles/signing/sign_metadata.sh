#!/usr/bin/env bash
# Detached ASCII-armored metadata signing script for a core:AsciiArmoredDetachedSigningService.
# Pulp invokes this once per file, passing the file path as $1, and exports the service's
# key fingerprint as PULP_SIGNING_KEY_FINGERPRINT. On success it must print JSON linking the
# original file to its signature. Mirrors pulpcore's canonical template (pytest_plugin.py
# SIGNING_SCRIPT_STRING / docs/admin/guides/sign-metadata.md).
#
# Runs as the pulp user at content-signing time, so --homedir points at the pulp-owned
# keyring created by init.sh.
set -euo pipefail

FILE_PATH="$1"
SIGNATURE_PATH="${1}.asc"
KEY_FPR="${PULP_SIGNING_KEY_FINGERPRINT}"

gpg --quiet --batch --yes --homedir /var/lib/pulp/.gnupg \
  --detach-sign --local-user "${KEY_FPR}" \
  --armor --output "${SIGNATURE_PATH}" "${FILE_PATH}"

echo "{\"file\": \"${FILE_PATH}\", \"signature\": \"${SIGNATURE_PATH}\"}"
