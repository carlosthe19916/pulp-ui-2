#!/usr/bin/env bash
# Creates the Pulp objects of the OSTree tutorial through the REST API (the same objects the
# tutorial creates in Pulp UI). Safe to re-run: existing objects are kept.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

# A small public OSTree repository; replace it with your OS vendor's for real use.
UPSTREAM_URL="${UPSTREAM_URL:-https://fixtures.pulpproject.org/ostree/small/}"
UPSTREAM_REFS="${UPSTREAM_REFS:-[\"stable\"]}"

# 1. Mirror upstream refs: remote + repository + sync. OSTree repositories publish themselves.
remote="$(ensure remotes/ostree/ostree ostree-upstream \
  "{\"name\":\"ostree-upstream\",\"url\":\"${UPSTREAM_URL}\",\"include_refs\":${UPSTREAM_REFS},\"policy\":\"immediate\"}")"
mirror="$(ensure repositories/ostree/ostree ostree-upstream \
  "{\"name\":\"ostree-upstream\",\"remote\":\"${remote}\"}")"
echo "syncing ostree-upstream" >&2
pulp_sync "$mirror" "$remote"
ensure distributions/ostree/ostree ostree-upstream \
  "{\"name\":\"ostree-upstream\",\"base_path\":\"ostree-upstream\",\"repository\":\"${mirror}\"}" >/dev/null

# 2. Hosted repository for your own commits, imported from archives.
hosted="$(ensure repositories/ostree/ostree ostree-hosted '{"name":"ostree-hosted"}')"
ensure distributions/ostree/ostree ostree-hosted \
  "{\"name\":\"ostree-hosted\",\"base_path\":\"ostree-hosted\",\"repository\":\"${hosted}\"}" >/dev/null

show_distributions distributions/ostree/ostree ostree-
