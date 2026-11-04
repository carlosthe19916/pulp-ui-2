#!/usr/bin/env bash
# Creates the Pulp objects of the generic files tutorial through the REST API (the same objects
# the tutorial creates in Pulp UI). Safe to re-run: existing objects are kept.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

# A public file repository described by a PULP_MANIFEST (one "path,sha256,size" line per file).
UPSTREAM_MANIFEST="${UPSTREAM_MANIFEST:-https://fixtures.pulpproject.org/file/PULP_MANIFEST}"

# 1. Mirror upstream files: remote (on demand) + repository that publishes itself + sync.
remote="$(ensure remotes/file/file files-upstream \
  "{\"name\":\"files-upstream\",\"url\":\"${UPSTREAM_MANIFEST}\",\"policy\":\"on_demand\"}")"
mirror="$(ensure repositories/file/file files-upstream \
  "{\"name\":\"files-upstream\",\"remote\":\"${remote}\",\"autopublish\":true}")"
echo "syncing files-upstream" >&2
pulp_sync "$mirror" "$remote"
ensure distributions/file/file files-upstream \
  "{\"name\":\"files-upstream\",\"base_path\":\"files-upstream\",\"repository\":\"${mirror}\"}" >/dev/null

# 2. Hosted repository for your own artifacts, published on every upload.
hosted="$(ensure repositories/file/file files-hosted '{"name":"files-hosted","autopublish":true}')"
ensure distributions/file/file files-hosted \
  "{\"name\":\"files-hosted\",\"base_path\":\"files-hosted\",\"repository\":\"${hosted}\"}" >/dev/null

show_distributions distributions/file/file files-
