#!/usr/bin/env bash
# Write client/openapi/pulp.json from a running Pulp's OpenAPI document (default: the local
# backend on :5003). Run `npm run generate` afterwards to rebuild the client from it.
set -euo pipefail

# shellcheck source=common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

url="${PULP_API_URL:-http://localhost:5003}"
root="${PULP_API_ROOT:-/api/pulp/}"
out="$REPO_ROOT/client/openapi/pulp.json"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

curl -fsS "${url%/}/${root#/}api/v3/docs/api.json" -o "$tmp" ||
  die "could not fetch the OpenAPI document from $url; is the backend up?"

# Python keeps number literals as Pulp writes them (0.0); JSON.stringify would rewrite them.
python3 -I - "$tmp" "$out" <<'PY'
import json
import sys

with open(sys.argv[1]) as src:
    spec = json.load(src)
with open(sys.argv[2], "w") as dst:
    dst.write(json.dumps(spec, indent=4, ensure_ascii=True))
PY

log "Wrote client/openapi/pulp.json from $url; run npm run generate to rebuild the client"
