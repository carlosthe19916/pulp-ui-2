#!/usr/bin/env bash
# Creates the Pulp objects of the APT tutorial through the REST API (the same objects the
# tutorial creates in Pulp UI). Safe to re-run: existing objects are kept.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

# A small public repository; replace it with http://deb.debian.org/debian/ for real use.
UPSTREAM_URL="${UPSTREAM_URL:-http://nginx.org/packages/debian/}"
UPSTREAM_DIST="${UPSTREAM_DIST:-bookworm}"
UPSTREAM_COMPONENT="${UPSTREAM_COMPONENT:-nginx}"
UPSTREAM_ARCH="${UPSTREAM_ARCH:-amd64}"

# 1. Mirror an upstream repository: remote (on demand) + repository that publishes itself + sync.
remote="$(ensure remotes/deb/apt apt-upstream "{\"name\":\"apt-upstream\",\"url\":\"${UPSTREAM_URL}\",
  \"distributions\":\"${UPSTREAM_DIST}\",\"components\":\"${UPSTREAM_COMPONENT}\",
  \"architectures\":\"${UPSTREAM_ARCH}\",\"policy\":\"on_demand\"}")"
mirror="$(ensure repositories/deb/apt apt-upstream \
  "{\"name\":\"apt-upstream\",\"remote\":\"${remote}\",\"autopublish\":true}")"
echo "syncing apt-upstream" >&2
pulp_sync "$mirror" "$remote"
ensure distributions/deb/apt apt-upstream \
  "{\"name\":\"apt-upstream\",\"base_path\":\"apt-upstream\",\"repository\":\"${mirror}\"}" >/dev/null

# 2. Hosted repository for your own packages, published on every upload.
hosted="$(ensure repositories/deb/apt apt-hosted '{"name":"apt-hosted","autopublish":true}')"
ensure distributions/deb/apt apt-hosted \
  "{\"name\":\"apt-hosted\",\"base_path\":\"apt-hosted\",\"repository\":\"${hosted}\"}" >/dev/null

show_distributions distributions/deb/apt apt-
