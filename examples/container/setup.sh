#!/usr/bin/env bash
# Creates the Pulp objects of the container tutorial through the REST API (the same objects the
# tutorial creates in Pulp UI). Safe to re-run: existing objects are kept. Hosted repositories
# need no setup: the first `podman push` creates them.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

UPSTREAM_REGISTRY="${UPSTREAM_REGISTRY:-https://registry-1.docker.io}"

# 1. Proxy Docker Hub: a pull-through remote and a pull-through distribution.
remote="$(ensure remotes/container/pull-through docker-hub \
  "{\"name\":\"docker-hub\",\"url\":\"${UPSTREAM_REGISTRY}\"}")"
ensure distributions/container/pull-through docker-hub \
  "{\"name\":\"docker-hub\",\"base_path\":\"docker-hub\",\"remote\":\"${remote}\"}" >/dev/null

echo
echo "Pull Docker Hub images as ${PULP_URL#*://}/${PULP_DOMAIN:+${PULP_DOMAIN}/}docker-hub/<image>:<tag>"
